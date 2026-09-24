import pytest

from app.services.solver import path_cost, solve_tsp, tour


def line_matrix(positions: list[float]) -> list[list[float]]:
    """Nodes on a straight road; cost is the distance between them."""
    return [[abs(a - b) for b in positions] for a in positions]


# Node indices are shuffled relative to their position on the line:
# node 0 at 0, node 1 at 30, node 2 at 10, node 3 at 20.
POSITIONS = [0, 30, 10, 20]


def test_open_path_visits_in_line_order():
    order = solve_tsp(line_matrix(POSITIONS), depot=0, return_to_depot=False, time_limit_ms=100)
    assert order == [0, 2, 3, 1]


def test_round_trip_finds_optimal_cost():
    matrix = line_matrix(POSITIONS)
    order = solve_tsp(matrix, depot=0, return_to_depot=True, time_limit_ms=100)
    assert order[0] == 0
    assert sorted(order) == [0, 1, 2, 3]
    assert path_cost(matrix, order, return_to_depot=True) == 60  # out to 30 and back


def test_non_zero_depot():
    order = solve_tsp(line_matrix(POSITIONS), depot=1, return_to_depot=False, time_limit_ms=100)
    assert order == [1, 3, 2, 0]


def test_asymmetric_costs_are_respected():
    # Going 1 -> 2 is cheap, 2 -> 1 is very expensive (think one-way street).
    matrix = [
        [0, 10, 10],
        [10, 0, 1],
        [10, 100, 0],
    ]
    order = solve_tsp(matrix, depot=0, return_to_depot=True, time_limit_ms=100)
    assert order == [0, 1, 2]


@pytest.mark.parametrize("n", [1, 2])
def test_trivial_sizes(n):
    matrix = [[0] * n for _ in range(n)]
    assert solve_tsp(matrix) == list(range(n))


def test_invalid_depot():
    with pytest.raises(ValueError):
        solve_tsp(line_matrix(POSITIONS), depot=4)


def test_tour_and_path_cost():
    matrix = line_matrix(POSITIONS)
    assert tour([0, 2, 3], return_to_depot=True) == [0, 2, 3, 0]
    assert tour([0, 2, 3], return_to_depot=False) == [0, 2, 3]
    assert path_cost(matrix, [0, 2, 3, 1], return_to_depot=False) == 30
