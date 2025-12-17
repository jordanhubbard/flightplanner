from fastapi.testclient import TestClient

from main import app


def test_weather_missing_api_key_returns_503(monkeypatch) -> None:
    import app.routers.weather as weather_router

    monkeypatch.delenv("OPENWEATHERMAP_API_KEY", raising=False)
    monkeypatch.setattr(weather_router, "get_airport_coordinates", lambda _code: {"latitude": 40.0, "longitude": -75.0})

    client = TestClient(app)
    resp = client.get("/api/weather/AAA")
    assert resp.status_code == 503
    assert "OPENWEATHERMAP_API_KEY" in resp.json()["detail"]


def test_weather_ok(monkeypatch) -> None:
    import app.routers.weather as weather_router

    monkeypatch.setenv("OPENWEATHERMAP_API_KEY", "test-key")
    monkeypatch.setattr(weather_router, "get_airport_coordinates", lambda _code: {"latitude": 40.0, "longitude": -75.0})
    monkeypatch.setattr(
        weather_router.openweathermap,
        "get_current_weather",
        lambda **_kwargs: {
            "weather": [{"main": "Clear", "description": "clear sky"}],
            "main": {"temp": 72.4},
            "wind": {"speed": 10.0, "deg": 270},
            "visibility": 16093,
            "clouds": {"all": 0},
        },
    )

    client = TestClient(app)
    resp = client.get("/api/weather/AAA")
    assert resp.status_code == 200
    body = resp.json()
    assert body["airport"] == "AAA"
    assert body["conditions"]
    assert body["temperature"] == 72
    assert body["wind_direction"] == 270
