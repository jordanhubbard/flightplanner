from fastapi.testclient import TestClient

from main import app


def test_terrain_point_requires_api_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENTOPOGRAPHY_API_KEY", raising=False)
    client = TestClient(app)
    resp = client.get("/api/terrain/point", params={"lat": 40.0, "lon": -75.0})
    assert resp.status_code == 503
    assert "OPENTOPOGRAPHY_API_KEY" in resp.json()["detail"]
