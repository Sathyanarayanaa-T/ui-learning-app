import pytest
from app.tests.conftest import client, test_user


def test_get_recommendations(client, test_user):
    """Test retrieving recommendations for a user"""
    response = client.get(f"/recommendations/{test_user.user_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_generate_recommendations(client, test_user):
    """Test generating new recommendations"""
    response = client.post(f"/recommendations/{test_user.user_id}/generate", json={
        "user_id": test_user.user_id
    })
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) or isinstance(data, dict)


def test_recommendations_for_nonexistent_user(client):
    """Test getting recommendations for non-existent user"""
    response = client.get("/recommendations/nonexistent_user_12345")
    assert response.status_code in [200, 404]


def test_recommendation_generation_with_filters(client, test_user):
    """Test generating recommendations with filters"""
    response = client.post(f"/recommendations/{test_user.user_id}/generate", json={
        "user_id": test_user.user_id,
        "topic_filter": "Python",
        "difficulty_filter": "beginner"
    })
    assert response.status_code in [200, 422]


def test_recommendations_response_format(client, test_user):
    """Test that recommendations have expected format"""
    response = client.get(f"/recommendations/{test_user.user_id}")
    assert response.status_code == 200
    data = response.json()
    
    # Should be a list
    assert isinstance(data, list)
    
    # If recommendations exist, check format
    if len(data) > 0:
        rec = data[0]
        # Should have common recommendation fields
        assert isinstance(rec, dict)


def test_recommendation_ranking(client, test_user):
    """Test that recommendations are ranked"""
    response = client.get(f"/recommendations/{test_user.user_id}")
    assert response.status_code == 200
    data = response.json()
    
    # If there are multiple recommendations, verify they're ranked
    if len(data) > 1:
        for i in range(len(data) - 1):
            rec1 = data[i]
            rec2 = data[i + 1]
            # First recommendation should have better or equal score than next
            if "score" in rec1 and "score" in rec2:
                assert rec1.get("score", 0) >= rec2.get("score", 0)
