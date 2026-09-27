import asyncio

from app.models.schemas import OptimizeRequest, OptimizeResponse
from app.services.osrm_client import OSRMClient
from app.services.solver import path_cost, solve_tsp, tour


async def optimize_route(
    request: OptimizeRequest, osrm: OSRMClient, time_limit_ms: int
) -> OptimizeResponse:
    stops = request.stops
    depot = request.depot_index
    back = request.return_to_depot
    points = [(stop.lat, stop.lng) for stop in stops]

    # 1. Drive times and distances between every pair of stops
    table = await osrm.get_table(points)

    # 2. Best visiting order (CPU-heavy, so run it in a separate thread)
    order = await asyncio.to_thread(
        solve_tsp,
        table.durations,
        depot=depot,
        return_to_depot=back,
        time_limit_ms=time_limit_ms,
    )

    # 3. Road shape for that order
    geometry = await osrm.get_route([points[i] for i in tour(order, back)])

    # 4. Baseline: depot first, then the other stops in the order the user entered them
    naive = [depot] + [i for i in range(len(stops)) if i != depot]

    return OptimizeResponse(
        order=[stops[i].id for i in order],
        geometry=geometry,
        total_duration_s=path_cost(table.durations, order, back),
        total_distance_m=path_cost(table.distances, order, back),
        naive_duration_s=path_cost(table.durations, naive, back),
        naive_distance_m=path_cost(table.distances, naive, back),
    )
