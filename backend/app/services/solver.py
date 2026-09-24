from ortools.constraint_solver import pywrapcp, routing_enums_pb2


class SolverError(Exception):
    """OR-Tools could not find a route."""


def tour(order: list[int], return_to_depot: bool) -> list[int]:
    """The full sequence of nodes driven, including the return leg if there is one."""
    return order + [order[0]] if return_to_depot else order


def path_cost(matrix: list[list[float]], order: list[int], return_to_depot: bool) -> float:
    nodes = tour(order, return_to_depot)
    return sum(matrix[a][b] for a, b in zip(nodes, nodes[1:]))


def solve_tsp(
    cost_matrix: list[list[float]],
    depot: int = 0,
    return_to_depot: bool = True,
    time_limit_ms: int = 1000,
) -> list[int]:
    """Find the cheapest order to visit every node exactly once.

    Returns node indices starting at the depot. The return to the depot is not repeated
    at the end; use tour() for that.
    """
    n = len(cost_matrix)
    if n == 0:
        raise ValueError("cost_matrix is empty")
    if not 0 <= depot < n:
        raise ValueError("depot is out of range")
    if n <= 2:
        return [depot] + [i for i in range(n) if i != depot]

    # OR-Tools only works with integer costs; seconds are precise enough.
    costs = [[int(round(c)) for c in row] for row in cost_matrix]
    if not return_to_depot:
        # A free ride back to the depot turns the round trip into an open path.
        for row in costs:
            row[depot] = 0

    manager = pywrapcp.RoutingIndexManager(n, 1, depot)  # n nodes, 1 vehicle
    routing = pywrapcp.RoutingModel(manager)

    def transit_cost(from_index: int, to_index: int) -> int:
        return costs[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

    callback = routing.RegisterTransitCallback(transit_cost)
    routing.SetArcCostEvaluatorOfAllVehicles(callback)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    params.time_limit.FromMilliseconds(time_limit_ms)

    solution = routing.SolveWithParameters(params)
    if solution is None:
        raise SolverError("No route found")

    order = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        order.append(manager.IndexToNode(index))
        index = solution.Value(routing.NextVar(index))
    return order
