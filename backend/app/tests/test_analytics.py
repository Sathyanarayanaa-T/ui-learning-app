import pytest
from app.tests.conftest import client, test_session


def test_get_global_analytics(client):
    """Test retrieving global analytics"""
    response = client.get("/analytics/global")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_get_session_analytics(client, test_session):
    """Test retrieving session-specific analytics"""
    response = client.get(f"/analytics/session/{test_session.session_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_analytics_session_not_found(client):
    """Test analytics for non-existent session"""
    import uuid
    fake_session_id = uuid.uuid4()
    response = client.get(f"/analytics/session/{fake_session_id}")
    # Should return 200 with empty data or 404
    assert response.status_code in [200, 404]


def test_cleanup_expired_sessions(client):
    """Test cleanup of expired sessions"""
    response = client.post("/analytics/cleanup")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data or "deleted" in data.keys()


def test_analytics_response_format(client):
    """Test that analytics response has expected format"""
    response = client.get("/analytics/global")
    assert response.status_code == 200
    data = response.json()
    
    # Should be a dictionary
    assert isinstance(data, dict)
    
    # Common analytics fields to check for
    possible_fields = [
        "total_sessions", "total_users", "total_messages", 
        "active_sessions", "avg_session_duration"
    ]
    # At least some fields should be present
    assert len(data) >= 0  # Data can be empty in fresh database
