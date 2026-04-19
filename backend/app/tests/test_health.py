import pytest
from app.tests.conftest import client


def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "AI Learning Chatbot Backend"
    assert "timestamp" in data


def test_health_check_response_format(client):
    """Test health check response has all required fields"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "app" in data
    assert "version" in data
