from fastapi.testclient import TestClient

from main import app


def test_plan_route_mode_ok(monkeypatch) -> None:
    def fake_get_airport_coordinates(code: str):
        code_u = code.upper()
        if code_u == "AAA":
            return {"latitude": 40.0, "longitude": -75.0}
        if code_u == "BBB":
            return {"latitude": 41.0, "longitude": -76.0}
        return None

    import app.routers.route as route_router

    monkeypatch.setattr(route_router, "get_airport_coordinates", fake_get_airport_coordinates)
    monkeypatch.setattr(
        route_router,
        "recommend_alternates",
        lambda **_: [
            {
                "code": "CCC",
                "name": "Alt",
                "type": "small_airport",
                "distance_nm": 12.3,
                "weather": {"visibility_sm": 10.0, "ceiling_ft": 5000},
            }
        ],
    )

    client = TestClient(app)
    resp = client.post(
        "/api/plan",
        json={
            "mode": "route",
            "origin": "AAA",
            "destination": "BBB",
            "speed": 100.0,
            "speed_unit": "knots",
            "altitude": 5500,
            "avoid_airspaces": False,
            "avoid_terrain": False,
            "include_alternates": True,
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["route"] == ["AAA", "BBB"]
    assert body["origin_coords"] == [40.0, -75.0]
    assert body["destination_coords"] == [41.0, -76.0]
    assert "distance_nm" in body
    assert "time_hr" in body
    assert "segments" in body
    assert body["alternates"][0]["code"] == "CCC"


def test_plan_route_mode_terrain_does_not_require_opentopo_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENTOPOGRAPHY_API_KEY", raising=False)
    monkeypatch.delenv("TERRAIN_PROVIDER", raising=False)

    def fake_get_airport_coordinates(code: str):
        code_u = code.upper()
        if code_u == "AAA":
            return {"latitude": 40.0, "longitude": -75.0}
        if code_u == "BBB":
            return {"latitude": 41.0, "longitude": -76.0}
        return None

    import app.routers.route as route_router

    monkeypatch.setattr(route_router, "get_airport_coordinates", fake_get_airport_coordinates)
    monkeypatch.setattr(
        route_router.terrain_service, "_fetch_open_meteo_elevations_m", lambda _pts: [0.0, 0.0]
    )

    client = TestClient(app)
    resp = client.post(
        "/api/plan",
        json={
            "mode": "route",
            "origin": "AAA",
            "destination": "BBB",
            "speed": 100.0,
            "speed_unit": "knots",
            "altitude": 5500,
            "avoid_airspaces": False,
            "avoid_terrain": True,
        },
    )

    assert resp.status_code == 200


def test_plan_route_mode_astar_multi_leg(monkeypatch) -> None:
    import app.routers.route as route_router

    monkeypatch.setattr(
        route_router,
        "load_airport_cache",
        lambda: [
            {"icao": "AAA", "latitude": 40.0, "longitude": -75.0, "name": "A"},
            {"icao": "BBB", "latitude": 41.0, "longitude": -75.0, "name": "B"},
            {"icao": "CCC", "latitude": 42.0, "longitude": -75.0, "name": "C"},
        ],
    )

    def fake_get_airport_coordinates(code: str):
        code_u = code.upper()
        if code_u == "AAA":
            return {"icao": "AAA", "iata": "", "latitude": 40.0, "longitude": -75.0}
        if code_u == "BBB":
            return {"icao": "BBB", "iata": "", "latitude": 41.0, "longitude": -75.0}
        if code_u == "CCC":
            return {"icao": "CCC", "iata": "", "latitude": 42.0, "longitude": -75.0}
        return None

    monkeypatch.setattr(route_router, "get_airport_coordinates", fake_get_airport_coordinates)

    client = TestClient(app)
    resp = client.post(
        "/api/plan",
        json={
            "mode": "route",
            "origin": "AAA",
            "destination": "CCC",
            "speed": 100.0,
            "speed_unit": "knots",
            "altitude": 5500,
            "avoid_airspaces": False,
            "avoid_terrain": False,
            "plan_fuel_stops": True,
            "aircraft_range_nm": 80,
            "max_leg_distance": 80,
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["route"] == ["AAA", "BBB", "CCC"]
    assert body["fuel_stops"] == ["BBB"]
    assert body["fuel_required_with_reserve_gal"] is not None


def test_plan_route_mode_astar_multi_leg_from_fuel_on_board(monkeypatch) -> None:
    import app.routers.route as route_router

    monkeypatch.setattr(
        route_router,
        "load_airport_cache",
        lambda: [
            {"icao": "AAA", "latitude": 40.0, "longitude": -75.0, "name": "A"},
            {"icao": "BBB", "latitude": 41.0, "longitude": -75.0, "name": "B"},
            {"icao": "CCC", "latitude": 42.0, "longitude": -75.0, "name": "C"},
        ],
    )

    def fake_get_airport_coordinates(code: str):
        code_u = code.upper()
        if code_u == "AAA":
            return {"icao": "AAA", "iata": "", "latitude": 40.0, "longitude": -75.0}
        if code_u == "BBB":
            return {"icao": "BBB", "iata": "", "latitude": 41.0, "longitude": -75.0}
        if code_u == "CCC":
            return {"icao": "CCC", "iata": "", "latitude": 42.0, "longitude": -75.0}
        return None

    monkeypatch.setattr(route_router, "get_airport_coordinates", fake_get_airport_coordinates)

    client = TestClient(app)
    resp = client.post(
        "/api/plan",
        json={
            "mode": "route",
            "origin": "AAA",
            "destination": "CCC",
            "speed": 100.0,
            "speed_unit": "knots",
            "altitude": 5500,
            "avoid_airspaces": False,
            "avoid_terrain": False,
            "plan_fuel_stops": True,
            "fuel_burn_gph": 10.0,
            "fuel_on_board_gal": 14.5,
            "reserve_minutes": 45,
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["route"] == ["AAA", "BBB", "CCC"]
    assert body["fuel_stops"] == ["BBB"]


def test_plan_route_mode_fuel_calculation(monkeypatch) -> None:
    import app.routers.route as route_router

    monkeypatch.setattr(
        route_router,
        "load_airport_cache",
        lambda: [
            {"icao": "AAA", "latitude": 40.0, "longitude": -75.0, "name": "A"},
            {"icao": "CCC", "latitude": 41.0, "longitude": -75.0, "name": "C"},
        ],
    )

    monkeypatch.setattr(
        route_router,
        "get_airport_coordinates",
        lambda code: {
            "icao": code.upper(),
            "iata": "",
            "latitude": 40.0 if code.upper() == "AAA" else 41.0,
            "longitude": -75.0,
        },
    )

    client = TestClient(app)
    resp = client.post(
        "/api/plan",
        json={
            "mode": "route",
            "origin": "AAA",
            "destination": "CCC",
            "speed": 60.0,
            "speed_unit": "knots",
            "altitude": 5500,
            "avoid_airspaces": False,
            "avoid_terrain": False,
            "fuel_burn_gph": 10.0,
            "reserve_minutes": 60,
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    # Roughly ~60nm between 1 degree latitude, at 60kt ~= 1hr, so ~10gal + 10gal reserve.
    assert body["fuel_required_gal"] is not None
    assert body["fuel_required_with_reserve_gal"] is not None
    assert body["fuel_required_with_reserve_gal"] >= body["fuel_required_gal"]


def test_plan_route_mode_apply_wind_adjusts_groundspeed(monkeypatch) -> None:
    import app.routers.route as route_router

    monkeypatch.setattr(
        route_router,
        "get_airport_coordinates",
        lambda code: {
            "icao": code.upper(),
            "iata": "",
            "latitude": 0.0,
            "longitude": 0.0 if code.upper() == "AAA" else 1.0,
        },
    )

    monkeypatch.setattr(
        route_router.open_meteo,
        "get_current_weather",
        lambda lat, lon: {"windspeed": 20.0, "winddirection": 90},
    )

    client = TestClient(app)
    resp = client.post(
        "/api/plan",
        json={
            "mode": "route",
            "origin": "AAA",
            "destination": "BBB",
            "speed": 100.0,
            "speed_unit": "knots",
            "altitude": 5500,
            "avoid_airspaces": False,
            "avoid_terrain": False,
            "apply_wind": True,
        },
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["groundspeed_kt"] is not None
    assert body["groundspeed_kt"] < 100.0


def test_plan_local_mode_ok(monkeypatch) -> None:
    import app.routers.local as local_router

    monkeypatch.setattr(
        local_router,
        "get_airport_coordinates",
        lambda code: {
            "icao": code.upper(),
            "iata": "",
            "name": "Center",
            "city": "City",
            "country": "US",
            "latitude": 40.0,
            "longitude": -75.0,
            "elevation": 0,
            "type": "small_airport",
        },
    )

    monkeypatch.setattr(
        local_router,
        "load_airport_cache",
        lambda: [
            {
                "icao": "AAA",
                "latitude": 40.0,
                "longitude": -75.0,
                "name": "Center",
                "city": "City",
                "country": "US",
            },
            {
                "icao": "BBB",
                "latitude": 40.1,
                "longitude": -75.0,
                "name": "Nearby",
                "city": "Town",
                "country": "US",
            },
            {
                "icao": "CCC",
                "latitude": 42.0,
                "longitude": -75.0,
                "name": "Far",
                "city": "Far Town",
                "country": "US",
            },
        ],
    )

    client = TestClient(app)
    resp = client.post("/api/plan", json={"mode": "local", "airport": "AAA", "radius_nm": 25})
    assert resp.status_code == 200

    body = resp.json()
    assert body["airport"] == "AAA"
    assert body["center"]["icao"] == "AAA"
    assert len(body["nearby_airports"]) == 1
    assert body["nearby_airports"][0]["icao"] == "BBB"
