# flightplanner

Unified VFR flight planning app:

- Route and local planning modes
- Leaflet map with optional OpenWeatherMap overlays
- Terrain profile and terrain clearance checks (OpenTopography)
- Current weather (OpenWeatherMap) + METAR enrichment + Open‑Meteo forecasts

## Quickstart

### Backend

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt

# Run API
.venv/bin/python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to the backend (`localhost:8000`) by default.

## Environment variables

Create a `.env` (see `.env.example`) and set any API keys you plan to use:

- `OPENWEATHERMAP_API_KEY` (required for `/api/weather/{code}` and map tile overlays)
- `OPENTOPOGRAPHY_API_KEY` (required for `/api/terrain/*` endpoints)
- `OPENAIP_API_KEY` (reserved for future airspace integrations)

## Data files (Git LFS)

Large cache files live in `backend/data/` and are tracked via Git LFS.

To regenerate caches from the source datasets:

```bash
.venv/bin/python scripts/build_data_caches.py
```
