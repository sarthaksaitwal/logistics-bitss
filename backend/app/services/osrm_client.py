from dataclasses import dataclass

import httpx

Point = tuple[float, float]  # (lat, lng)


class OSRMError(Exception):
    """OSRM could not answer: network problem, bad response, or unreachable stop."""


@dataclass
class TableResult:
    durations: list[list[float]]  # seconds; durations[i][j] = drive time from i to j
    distances: list[list[float]]  # metres


class OSRMClient:
    def __init__(self, http: httpx.AsyncClient, base_url: str, profile: str = "driving"):
        self.http = http
        self.base_url = base_url.rstrip("/")
        self.profile = profile

    @staticmethod
    def _format_coords(points: list[Point]) -> str:
        # OSRM wants "lng,lat;lng,lat;..." (longitude first!)
        return ";".join(f"{lng:.6f},{lat:.6f}" for lat, lng in points)

    async def _get(self, service: str, points: list[Point], params: dict) -> dict:
        url = f"{self.base_url}/{service}/v1/{self.profile}/{self._format_coords(points)}"
        try:
            response = await self.http.get(url, params=params)
        except httpx.HTTPError as exc:
            raise OSRMError(f"Could not reach OSRM: {exc}") from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise OSRMError(
                f"OSRM returned HTTP {response.status_code} with a non-JSON body"
            ) from exc

        if data.get("code") != "Ok":
            raise OSRMError(f"OSRM error {data.get('code')}: {data.get('message', 'no message')}")
        return data

    async def get_table(self, points: list[Point]) -> TableResult:
        data = await self._get("table", points, {"annotations": "duration,distance"})
        durations = data["durations"]
        distances = data["distances"]

        for i, row in enumerate(durations):
            for j, value in enumerate(row):
                if value is None or distances[i][j] is None:
                    raise OSRMError(f"No road route between stop {i} and stop {j}")

        return TableResult(durations=durations, distances=distances)

    async def get_route(self, points: list[Point]) -> list[Point]:
        data = await self._get("route", points, {"overview": "full", "geometries": "geojson"})
        coordinates = data["routes"][0]["geometry"]["coordinates"]  # [[lng, lat], ...]
        return [(lat, lng) for lng, lat in coordinates]



# http://router.project-osrm.org/table/v1/driving/77.2295,28.6129;77.2167,28.6315?annotations=duration,distance
#     {
#   "code": "Ok",
#   "distances": [
#     [0, 2822.5],
#     [4697.4, 0]
#   ],
#   "destinations": [
#     {
#       "hint": "8Tn1gP___38OAAAAFAAAAHEAAAB8AAAA46WAQe900UD-CvxCA9nnQg4AAAAUAAAAcQAAAHwAAAB6JwEAj2aaBGKZtAG8bZoEJJm0AQIALwAAAAAA",
#       "location": [77.227663, 28.612962],
#       "name": "",
#       "distance": 179.7688659
#     },
#     {
#       "hint": "y99wgP___38FAAAAEgAAAAAAAAAAAAAA3aAKQf9VnEEAAAAAAAAAAAUAAAASAAAAAAAAAAAAAAB6JwEAzTuaBNDhtAG8O5oEzOG0AQAAfxUAAAAA",
#       "location": [77.216717, 28.631504],
#       "name": "Outer Circle",
#       "distance": 1.720500065
#     }
#   ],
#   "durations": [
#     [0, 206.7],
#     [343.7, 0]
#   ],
#   "sources": [
#     {
#       "hint": "8Tn1gP___38OAAAAFAAAAHEAAAB8AAAA46WAQe900UD-CvxCA9nnQg4AAAAUAAAAcQAAAHwAAAB6JwEAj2aaBGKZtAG8bZoEJJm0AQIALwAAAAAA",
#       "location": [77.227663, 28.612962],
#       "name": "",
#       "distance": 179.7688659
#     },
#     {
#       "hint": "y99wgP___38FAAAAEgAAAAAAAAAAAAAA3aAKQf9VnEEAAAAAAAAAAAUAAAASAAAAAAAAAAAAAAB6JwEAzTuaBNDhtAG8O5oEzOG0AQAAfxUAAAAA",
#       "location": [77.216717, 28.631504],
#       "name": "Outer Circle",
#       "distance": 1.720500065
#     }
#   ]
# }