from fastapi.testclient import TestClient

from main import app


def test_weather_route_sampling(monkeypatch) -> None:
    import app.routers.weather as weather_router

    monkeypatch.setattr(
        weather_router.open_meteo,
        "get_current_weather",
        lambda **_kwargs: {"temperature": 70.0, "windspeed": 10.0, "winddirection": 180, "time": "2025-01-01T00:00"},
    )

    client = TestClient(app)
    points = [(40.0 + i * 0.01, -75.0) for i in range(21)]
    resp = client.post("/api/weather/route", json={"points": points, "max_points": 5})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["points"]) <= 5
    assert body["points"][0]["temperature_f"] == 70.0
