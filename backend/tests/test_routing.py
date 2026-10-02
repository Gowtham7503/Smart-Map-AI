import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_hazards_api(client):
    res = client.get("/api/hazards")
    assert res.status_code == 200
    data = res.get_json()
    assert "hazards" in data
    assert isinstance(data["hazards"], list)

def test_report_hazard_api(client):
    payload = {
        "lat": 12.9716,
        "lng": 77.5946,
        "type": "pothole",
        "severity": "medium",
        "description": "Pothole on right lane"
    }
    res = client.post("/api/hazards", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert "hazard" in data

def test_chatbot_routing_intent(client):
    payload = {
        "message": "i need to go from hyderabad to delhi safely",
        "latitude": 17.3850,
        "longitude": 78.4867
    }
    res = client.post("/api/chatbot/recommendations", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert "reply" in data
    assert "action" in data
    assert data["action"] is not None
    assert data["action"]["type"] == "directions"
    assert "Hyderabad" in data["action"]["from"]
    assert "Delhi" in data["action"]["to"]
    assert data["action"]["filters"]["safest"] is True

