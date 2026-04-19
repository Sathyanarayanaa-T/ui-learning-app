import pytest
from app.tests.conftest import client, test_user


def test_create_session(client, test_user):
    """Test creating a new session"""
    response = client.post("/session/create")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "created_at" in data
    assert data["status"] == "active"


def test_create_session_missing_user_id(client):
    """Test session creation works without user_id (auto-anonymous)"""
    # The endpoint doesn't require user_id - it creates anonymous session
    response = client.post("/session/create")
    assert response.status_code == 200


def test_create_session_with_optional_fields(client, test_user):
    """Test session creation returns proper response"""
    response = client.post("/session/create")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "created_at" in data


def test_session_returns_uuid(client, test_user):
    """Test that session_id is a valid UUID"""
    import uuid
    response = client.post("/session/create")
    assert response.status_code == 200
    session_id = response.json()["session_id"]
    
    # Verify it's a valid UUID
    try:
        uuid.UUID(str(session_id))
    except ValueError:
        pytest.fail(f"session_id {session_id} is not a valid UUID")
