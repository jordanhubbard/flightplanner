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


def test_plan_local_mode_not_implemented() -> None:
    client = TestClient(app)
    resp = client.post("/api/plan", json={"mode": "local", "airport": "AAA"})
    assert resp.status_code == 501
