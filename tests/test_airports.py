from fastapi.testclient import TestClient

from main import app


def test_airports_search_and_lookup(monkeypatch) -> None:
    import app.models.airport as airport_model

    monkeypatch.setattr(
        airport_model,
        "load_airport_cache",
        lambda: [
            {
                "icao": "KPAO",
                "iata": "PAO",
                "name": "Palo Alto Airport",
                "city": "Palo Alto",
                "country": "US",
                "latitude": 37.4611,
                "longitude": -122.115,
                "elevation": 4,
                "type": "small_airport",
            },
            {
                "icao": "KSQL",
                "iata": "SQL",
                "name": "San Carlos",
                "city": "San Carlos",
                "country": "US",
                "latitude": 37.5119,
                "longitude": -122.249,
                "elevation": 5,
                "type": "small_airport",
            },
        ],
    )

    client = TestClient(app)

    resp = client.get("/api/airports/search", params={"q": "palo"})
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 1
    assert results[0]["icao"] == "KPAO"
    assert results[0]["iata"] == "PAO"

    resp2 = client.get("/api/airports/KSQL")
    assert resp2.status_code == 200
    airport = resp2.json()
    assert airport["icao"] == "KSQL"
