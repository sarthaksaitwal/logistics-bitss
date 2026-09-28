# Logistics bitss

**Find the fastest order for one driver to visit up to 25 stops, using real road travel times.**

<!-- Demo GIF: record it, save it as docs/demo.gif, then uncomment the next line. -->
<!-- ![Logistics bitss demo](docs/demo.gif) -->

Drop pins on a map and the app works out the quickest order to visit them, draws the route along real roads, and shows how much drive time it saves compared with visiting the stops in the order you entered them.

## Features

- **Optimal visiting order.** Solves the Traveling Salesman Problem with [Google OR-Tools](https://developers.google.com/optimization).
- **Real road travel times.** Drive times and distances come from [OSRM](https://project-osrm.org/) on OpenStreetMap data, not straight-line distance. One-way streets are respected, because A→B can take longer than B→A.
- **Interactive map.** Drag pins to move stops, click the map to add one, or remove stops from the list. The route re-optimizes automatically.
- **Route options.** Choose the starting stop, and switch between a round trip and a one-way route.
- **Honest comparison.** Shows "X% faster than the order entered", with both routes measured on the same travel-time matrix.
- **Built to handle failure.** Input validation, cancellation of out-of-date requests, and clear error messages when a stop can't be reached or the routing service is down.

## Tech stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19, Vite, JavaScript | UI and state |
| Map | Leaflet, react-leaflet, OpenStreetMap tiles | Map, draggable pins, route line |
| Backend | Python, FastAPI, Pydantic | REST API and request validation |
| Optimization | Google OR-Tools | TSP solver (guided local search) |
| Routing data | OSRM (`/table` and `/route` services) | Travel-time matrix and road geometry |
| Testing | pytest, httpx `MockTransport`, FastAPI `TestClient` | Offline tests with a fake OSRM |

## How it works

```
React app ──POST /api/optimize──► FastAPI
                                    │
                                    ├─ 1. Validate the stops (Pydantic)
                                    ├─ 2. OSRM /table  → n×n drive-time and distance matrix
                                    ├─ 3. OR-Tools     → best visiting order
                                    ├─ 4. OSRM /route  → road geometry for that order
                                    └─ 5. Compare with the order the stops were entered in
                                    │
React app ◄──── order, geometry, totals ──┘
```

1. **Travel-time matrix.** One OSRM `/table` request returns the drive time and distance between every pair of stops. The matrix is **asymmetric**, because one-way streets and turn restrictions make A→B differ from B→A.
2. **Solving.** OR-Tools finds the order with the lowest total drive time. It builds a first route with *path cheapest arc*, then improves it with *guided local search* for up to 1 second. The solver is CPU-bound, so it runs in a worker thread (`asyncio.to_thread`) to keep the async server responsive.
3. **One-way trips.** For routes that don't return to the start, the cost of every "return to start" leg is set to 0, so the solver effectively optimizes an open path.
4. **Road geometry.** OSRM `/route` returns the exact road shape for the chosen order, which the frontend draws as a line.
5. **Baseline.** The "entered order" route (start first, then the other stops as entered) is costed from the **same matrix**, so the "% faster" figure compares like with like.

## Run with Docker

The quickest way to run the app. Requires only [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/sarthaksaitwal/logistics-bitss.git
cd logistics-bitss
docker compose up --build
```

Open http://localhost:8080. The API docs are at http://localhost:8000/docs.

The first build takes a few minutes; later starts take seconds. Stop with `Ctrl + C`, or run `docker compose down`.


## Running locally

**Requirements:** Python 3.10+ and Node.js 18+.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000, with interactive docs at http://localhost:8000/docs.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env            # Windows (cmd): copy .env.example .env
npm run dev
```

Open http://localhost:5173.

## API

### `POST /api/optimize`

**Request**

```json
{
  "stops": [
    { "id": "India Gate",      "lat": 28.6129, "lng": 77.2295 },
    { "id": "Red Fort",        "lat": 28.6562, "lng": 77.2410 },
    { "id": "Connaught Place", "lat": 28.6315, "lng": 77.2167 }
  ],
  "depot_index": 0,
  "return_to_depot": true
}
```

| Field | Type | Notes |
|---|---|---|
| `stops` | list | 2–25 stops, each with a unique `id`, `lat` and `lng` |
| `depot_index` | int | Index of the starting stop (default `0`) |
| `return_to_depot` | bool | Round trip (`true`, default) or one-way (`false`) |

**Response**

```json
{
  "order": ["India Gate", "Connaught Place", "Red Fort"],
  "geometry": [[28.612962, 77.227663], [28.61301, 77.22771], "..."],
  "total_duration_s": 1520.4,
  "total_distance_m": 9840.2,
  "naive_duration_s": 1710.9,
  "naive_distance_m": 11230.5
}
```

- `order`: stop ids in visiting order, starting with the depot.
- `geometry`: the road route as `[lat, lng]` points.
- `total_*`: the optimized route. `naive_*`: the stops visited in the order entered.

**Errors**

| Status | When |
|---|---|
| `422` | Invalid input (fewer than 2 stops, duplicate ids, coordinates out of range), or a stop that can't be reached by road |
| `502` | The OSRM routing service is unavailable |

### `GET /api/health`

Returns `{"status": "ok"}`.

## Configuration

**Backend** (`backend/.env`, optional; see `backend/.env.example`)

| Variable | Default | Description |
|---|---|---|
| `OSRM_URL` | `http://router.project-osrm.org` | OSRM server |
| `OSRM_PROFILE` | `driving` | OSRM routing profile |
| `OSRM_TIMEOUT_S` | `10` | Timeout for OSRM requests, in seconds |
| `SOLVER_TIME_LIMIT_MS` | `1000` | OR-Tools search time limit |
| `MAX_STOPS` | `25` | Maximum stops per request |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Origins allowed to call the API |

**Frontend** (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend URL |

## Tests

The backend tests run **offline**: OSRM is replaced by a fake HTTP transport or a fake client, so no network access is needed.

```bash
cd backend
pytest
```

They cover the solver (known optimal routes, asymmetric costs, open paths), the OSRM client (coordinate order, response parsing, every error path), and the API end to end (validation, status codes, and the optimized vs entered totals).

Frontend linting:

```bash
cd frontend
npm run lint
```

## Project structure

```
backend/
  app/
    main.py                 FastAPI app, shared HTTP client, CORS
    config.py               Settings from environment variables
    api/routes.py           /api/health and /api/optimize
    models/schemas.py       Request and response models
    services/
      osrm_client.py        OSRM /table and /route client
      solver.py             OR-Tools TSP solver
      optimizer.py          Matrix → solve → geometry → baseline pipeline
  tests/                    Solver, OSRM client and API tests
frontend/
  src/
    App.jsx                 App state: stops, start, round trip
    api/optimize.js         Calls the backend
    hooks/useRouteOptimizer.js   Loading, error and result state; cancels stale requests
    components/             Map, pins, route line, sidebar, stop list, summary
```

## Limitations

- **Public OSRM server.** The demo uses OSRM's free public server, which is rate-limited and has no uptime guarantee. For heavier use, run your own OSRM instance and set `OSRM_URL`.
- **Up to 25 stops.** This keeps requests fast and within the public server's limits.
- **Near-optimal, not proven optimal.** With a 1-second search limit, OR-Tools reliably finds excellent routes at this size, but it doesn't prove optimality.
- **Map tiles.** The OpenStreetMap tile server is meant for light use, such as demos.

## Possible extensions

- Address search (geocoding) instead of placing pins by hand
- Delivery time windows
- Multiple vehicles (the Vehicle Routing Problem)
- A self-hosted OSRM server via Docker

## Acknowledgements

Road data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Routing by [OSRM](https://project-osrm.org/). Optimization by [Google OR-Tools](https://developers.google.com/optimization). Maps by [Leaflet](https://leafletjs.com/).
