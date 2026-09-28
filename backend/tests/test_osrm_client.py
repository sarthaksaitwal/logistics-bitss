import asyncio

import httpx
import pytest

from app.services.osrm_client import OSRMClient, OSRMError

BASE_URL = "http://osrm.test/"  # trailing slash on purpose: the client should strip it
POINTS = [(28.6129, 77.2295), (28.6315, 77.2167)]  # (lat, lng)


def call_osrm(handler, action):
    """Run action(osrm_client) against a fake OSRM server that answers with handler."""

    async def main():
        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http:
            return await action(OSRMClient(http, BASE_URL))

    return asyncio.run(main())


def test_table_sends_lng_lat_and_parses_matrices():
    seen = {}

    def handler(request):
        seen["path"] = request.url.path
        seen["params"] = dict(request.url.params)
        return httpx.Response(200, json={
            "code": "Ok",
            "durations": [[0, 206.7], [343.7, 0]],
            "distances": [[0, 2822.5], [4697.4, 0]],
        })

    table = call_osrm(handler, lambda osrm: osrm.get_table(POINTS))

    assert seen["path"] == "/table/v1/driving/77.229500,28.612900;77.216700,28.631500"
    assert seen["params"] == {"annotations": "duration,distance"}
    assert table.durations == [[0, 206.7], [343.7, 0]]
    assert table.distances == [[0, 2822.5], [4697.4, 0]]


def test_unreachable_stop_raises():
    def handler(request):
        return httpx.Response(200, json={
            "code": "Ok",
            "durations": [[0, None], [343.7, 0]],
            "distances": [[0, None], [4697.4, 0]],
        })

    with pytest.raises(OSRMError, match="stop 0 and stop 1"):
        call_osrm(handler, lambda osrm: osrm.get_table(POINTS))


def test_route_flips_geometry_to_lat_lng():
    seen = {}

    def handler(request):
        seen["params"] = dict(request.url.params)
        return httpx.Response(200, json={
            "code": "Ok",
            "routes": [{"geometry": {"coordinates": [[77.2276, 28.6129], [77.2167, 28.6315]]}}],
        })

    line = call_osrm(handler, lambda osrm: osrm.get_route(POINTS))

    assert seen["params"] == {"overview": "full", "geometries": "geojson"}
    assert line == [(28.6129, 77.2276), (28.6315, 77.2167)]


def test_osrm_error_code_raises():
    def handler(request):
        return httpx.Response(400, json={"code": "InvalidQuery", "message": "Query string malformed"})

    with pytest.raises(OSRMError, match="InvalidQuery"):
        call_osrm(handler, lambda osrm: osrm.get_table(POINTS))


def test_non_json_response_raises():
    def handler(request):
        return httpx.Response(429, text="Too Many Requests")

    with pytest.raises(OSRMError, match="429"):
        call_osrm(handler, lambda osrm: osrm.get_table(POINTS))


def test_network_error_raises():
    def handler(request):
        raise httpx.ConnectError("connection refused")

    with pytest.raises(OSRMError, match="Could not reach OSRM"):
        call_osrm(handler, lambda osrm: osrm.get_table(POINTS))
