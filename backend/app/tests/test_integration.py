import pytest
from app.tests.conftest import client, test_user


def test_complete_learning_flow(client, test_user):
    """
    Integration test: Complete learning session flow
    1. Create session
    2. Send chat messages
    3. Submit feedback
    4. Check progress
    """
    
    # Step 1: Create a session
    session_response = client.post("/session/create", json={
        "user_id": test_user.user_id,
        "topic": "Python Basics"
    })
    assert session_response.status_code == 200
    session_id = session_response.json()["session_id"]
    
    # Step 2: Send a chat message
    chat_response = client.post("/ai/chat", json={
        "session_id": session_id,
        "message": "What is a variable in Python?",
        "user_id": test_user.user_id
    })
    assert chat_response.status_code == 200
    assert "ai_response" in chat_response.json()
    
    # Step 3: Submit feedback
    feedback_response = client.post("/feedback", json={
        "user_id": test_user.user_id,
        "session_id": session_id,
        "rating": 5,
        "comments": "Excellent explanation!"
    })
    assert feedback_response.status_code == 200
    
    # Step 4: Check progress
    progress_response = client.get(f"/progress/stats/{test_user.user_id}")
    assert progress_response.status_code == 200
    
    print("✅ Complete learning flow test passed!")


def test_multi_message_session(client, test_user):
    """
    Integration test: Multiple messages in one session
    """
    # Create session
    session_response = client.post("/session/create", json={
        "user_id": test_user.user_id,
        "topic": "Data Structures"
    })
    session_id = session_response.json()["session_id"]
    
    # Send multiple messages
    messages = [
        "What is a list?",
        "How do I create a list in Python?",
        "What's the difference between a list and a tuple?"
    ]
    
    for msg in messages:
        response = client.post("/ai/chat", json={
            "session_id": session_id,
            "message": msg,
            "user_id": test_user.user_id
        })
        assert response.status_code == 200
        data = response.json()
        assert "ai_response" in data
        assert len(data["ai_response"]) > 0
    
    # Verify history
    history_response = client.get(f"/ai/chat/history/{session_id}")
    assert history_response.status_code == 200
    
    print("✅ Multi-message session test passed!")


def test_analytics_after_session(client, test_user):
    """
    Integration test: Analytics are updated after session
    """
    # Create and interact with session
    session_response = client.post("/session/create", json={
        "user_id": test_user.user_id,
        "topic": "Loops"
    })
    session_id = session_response.json()["session_id"]
    
    # Send message
    client.post("/ai/chat", json={
        "session_id": session_id,
        "message": "Explain while loops",
        "user_id": test_user.user_id
    })
    
    # Check analytics
    global_analytics = client.get("/analytics/global")
    assert global_analytics.status_code == 200
    
    session_analytics = client.get(f"/analytics/session/{session_id}")
    assert session_analytics.status_code == 200
    
    print("✅ Analytics after session test passed!")


def test_health_before_and_after_operations(client):
    """
    Integration test: Health check remains healthy after operations
    """
    # Check health initially
    initial_health = client.get("/health")
    assert initial_health.status_code == 200
    initial_status = initial_health.json()["status"]
    
    # Do some operations (session creation)
    client.post("/session/create", json={
        "user_id": "test_user",
        "topic": "Testing"
    })
    
    # Check health again
    final_health = client.get("/health")
    assert final_health.status_code == 200
    final_status = final_health.json()["status"]
    
    # Status should remain healthy
    assert initial_status == final_status == "healthy"
    
    print("✅ Health consistency test passed!")


def test_concurrent_sessions_same_user(client, test_user):
    """
    Integration test: Same user can have multiple sessions
    """
    sessions = []
    
    # Create multiple sessions for same user
    for i in range(3):
        response = client.post("/session/create", json={
            "user_id": test_user.user_id,
            "topic": f"Topic {i+1}"
        })
        assert response.status_code == 200
        sessions.append(response.json()["session_id"])
    
    # Verify all sessions are different
    assert len(set(sessions)) == 3
    
    # Send message to each session
    for session_id in sessions:
        response = client.post("/ai/chat", json={
            "session_id": session_id,
            "message": "Test message",
            "user_id": test_user.user_id
        })
        assert response.status_code == 200
    
    print("✅ Concurrent sessions test passed!")
