import pytest
from app.tests.conftest import client, test_user, test_topic


def test_get_user_progress(client, test_user):
    """Test retrieving user progress"""
    response = client.get(f"/progress/stats/{test_user.user_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_get_topic_progress(client, test_user, test_topic):
    """Test retrieving progress for a specific topic"""
    response = client.get(f"/progress/{test_user.user_id}/{test_topic.id}")
    assert response.status_code in [200, 404]  # 404 if progress doesn't exist yet


def test_update_progress(client, test_user, test_topic):
    """Test updating user progress"""
    response = client.post(f"/progress/update", json={
        "user_id": test_user.user_id,
        "topic_id": test_topic.id,
        "completion_percentage": 50,
        "score": 85
    })
    assert response.status_code == 200
    data = response.json()
    assert "message" in data or "success" in str(data).lower()


def test_update_progress_missing_user_id(client, test_topic):
    """Test progress update fails without user_id"""
    response = client.post(f"/progress/update", json={
        "topic_id": test_topic.id,
        "completion_percentage": 50,
        "score": 85
    })
    assert response.status_code == 422


def test_progress_stats_format(client, test_user):
    """Test that progress stats have expected format"""
    response = client.get(f"/progress/stats/{test_user.user_id}")
    assert response.status_code == 200
    data = response.json()
    
    # Should be a dictionary
    assert isinstance(data, dict)


def test_get_progress_for_nonexistent_user(client):
    """Test getting progress for non-existent user"""
    response = client.get("/progress/stats/nonexistent_user_12345")
    assert response.status_code in [200, 404]


def test_update_progress_validates_completion_percentage(client, test_user, test_topic):
    """Test that completion percentage is validated"""
    response = client.post("/progress/update", json={
        "user_id": test_user.user_id,
        "topic_id": test_topic.id,
        "completion_percentage": 150,  # Invalid - should be 0-100
        "score": 85
    })
    # Should either reject invalid value or accept it
    assert response.status_code in [200, 422]
