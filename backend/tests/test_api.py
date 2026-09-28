import pytest
from fastapi.testclient import TestClient

from app.api.routes import get_osrm_client
from app.config import settings
from app.main import app
from app.services.osrm_client import OSRMError, TableResult, UnreachableError

class FakeOSRM:
    """Stands in for OSRMClient: no internet, predictable numbers.

    Every 0.01 degrees apart (horizontal + vertical) = 100 seconds and 1000 metres.
    """

    def __init__(self, fail: bool = False):
        self.fail = fail

    async def get_table(self, points):
        if self.fail:
            raise OSRMError("OSRM is down")

        def matrix(scale):
            return [
                [round((abs(a[0] - b[0]) + abs(a[1] - b[1])) * scale) for b in points]
                for a in points
            ]

        return TableResult(durations=matrix(10_000), distances=matrix(100_000))

    async def get_route(self, points):
        return list(points)  # a "road" that is just straight lines between the stops


# All stops on one straight east-west line, entered in a bad order:
#   depot(0.00) ---- a(0.01) ---- b(0.02) ---- c(0.03)
STOPS = [
    {"id": "depot", "lat": 0, "lng": 0.00},
    {"id": "c", "lat": 0, "lng": 0.03},
    {"id": "a", "lat": 0, "lng": 0.01},
    {"id": "b", "lat": 0, "lng": 0.02},
]


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(settings, "solver_time_limit_ms", 100)
    app.dependency_overrides[get_osrm_client] = lambda: FakeOSRM()
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_open_path(client):
    response = client.post("/api/optimize", json={"stops": STOPS, "return_to_depot": False})
    assert response.status_code == 200

    data = response.json()
    assert data["order"] == ["depot", "a", "b", "c"]
    assert data["total_duration_s"] == 300    # 100 + 100 + 100
    assert data["naive_duration_s"] == 600    # depot->c 300, c->a 200, a->b 100
    assert data["total_distance_m"] == 3000
    assert data["naive_distance_m"] == 6000
    assert len(data["geometry"]) == 4


def test_round_trip(client):
    response = client.post("/api/optimize", json={"stops": STOPS})
    assert response.status_code == 200

    data = response.json()
    assert data["order"][0] == "depot"
    assert sorted(data["order"]) == ["a", "b", "c", "depot"]
    assert data["total_duration_s"] == 600    # out to c and back
    assert data["naive_duration_s"] == 800    # 600 + b->depot 200
    assert data["geometry"][0] == data["geometry"][-1]  # ends where it started


@pytest.mark.parametrize(
    "body",
    [
        {"stops": STOPS[:1]},                                   # only one stop
        {"stops": [STOPS[0], STOPS[0]]},                        # duplicate ids
        {"stops": STOPS, "depot_index": 4},                     # depot out of range
        {"stops": [{"id": "x", "lat": 200, "lng": 0}, STOPS[1]]},  # latitude out of range
        {"stops": [{"id": "x", "lat": 0}, STOPS[1]]},           # missing lng
    ],
)
def test_invalid_requests_return_422(client, body):
    response = client.post("/api/optimize", json=body)
    assert response.status_code == 422


def test_osrm_failure_returns_502(client):
    app.dependency_overrides[get_osrm_client] = lambda: FakeOSRM(fail=True)

    response = client.post("/api/optimize", json={"stops": STOPS})

    assert response.status_code == 502
    assert response.json() == {"detail": "OSRM is down"}

class UnreachableOSRM(FakeOSRM):
    async def get_table(self, points):
        raise UnreachableError(0, 2)


def test_unreachable_stop_returns_422_with_names(client):
    app.dependency_overrides[get_osrm_client] = lambda: UnreachableOSRM()

    response = client.post("/api/optimize", json={"stops": STOPS})

    assert response.status_code == 422
    assert response.json()["detail"].startswith("No road route between depot and a.")
