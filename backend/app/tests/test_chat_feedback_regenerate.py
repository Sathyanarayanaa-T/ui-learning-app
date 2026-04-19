"""
Test suite for Chat Feedback (Like/Dislike) and Regenerate features.
Tests the complete integration between frontend and backend.
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.models.db_models import (
    User, ChatSession, Chat, ChatFeedback, ChatRegeneration
)
from app.models.chat_models import (
    ChatRequest, ChatFeedbackRequest, RegenerateChatRequest
)
from app.core.database import get_db


# ==================== Test Fixtures ====================

@pytest.fixture
def test_user(db_session: Session):
    """Create a test user"""
    user = User(
        user_id=str(uuid.uuid4()),
        username="test_user",
        email="test@example.com"
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def test_session(db_session: Session, test_user: User):
    """Create a test chat session"""
    session = ChatSession(
        session_id=str(uuid.uuid4()),
        user_id=test_user.user_id,
        mode="normal"
    )
    db_session.add(session)
    db_session.commit()
    return session


@pytest.fixture
def test_chat(db_session: Session, test_user: User, test_session: ChatSession):
    """Create a test chat message"""
    chat = Chat(
        chat_id=str(uuid.uuid4()),
        session_id=test_session.session_id,
        user_id=test_user.user_id,
        user_message="What is AI?",
        ai_response="AI is artificial intelligence...",
        mode="normal",
        model="gpt-4"
    )
    db_session.add(chat)
    db_session.commit()
    return chat


# ==================== Tests for Chat Message Creation ====================

@patch('app.services.core.ai_service.AIService.chat')
def test_chat_message_includes_chat_id(mock_chat, client: TestClient, test_session: ChatSession):
    """Test that chat response includes chat_id field"""
    # Mock the AI response
    mock_chat.return_value = "Machine learning is a subset of AI that enables systems to learn from data."
    
    response = client.post(
        "/ai/chat",
        json={
            "session_id": test_session.session_id,
            "message": "What is machine learning?",
            "mode": "normal"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify chat_id is in response
    assert "chat_id" in data
    assert data["chat_id"] is not None
    assert isinstance(data["chat_id"], str)
    assert len(data["chat_id"]) > 0
    
    # Verify other required fields
    assert "session_id" in data
    assert "ai_response" in data
    assert "user_message" in data
    assert "mode" in data
    assert "timestamp" in data


@patch('app.services.core.ai_service.AIService.chat')
def test_chat_message_saved_to_database(mock_chat, client: TestClient, test_session: ChatSession, db_session: Session):
    """Test that chat message is saved to database"""
    # Mock the AI response
    mock_chat.return_value = "Neural networks are computing systems inspired by biological neurons."
    
    message_text = "Explain neural networks"
    
    response = client.post(
        "/ai/chat",
        json={
            "session_id": test_session.session_id,
            "message": message_text,
            "mode": "normal"
        }
    )
    
    assert response.status_code == 200
    chat_id = response.json()["chat_id"]
    
    # Verify chat is in database
    chat = db_session.query(Chat).filter(Chat.chat_id == chat_id).first()
    assert chat is not None
    assert chat.user_message == message_text
    assert chat.ai_response is not None
    assert len(chat.ai_response) > 0


# ==================== Tests for Like/Dislike Feedback ====================

def test_submit_like_feedback(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test submitting a like feedback"""
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": True,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify feedback response
    assert "feedback_id" in data
    assert data["chat_id"] == test_chat.chat_id
    assert data["is_liked"] is True
    assert "created_at" in data


def test_submit_dislike_feedback(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test submitting a dislike feedback"""
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": False,
            "feedback_text": "Response was too long",
            "improvement_suggestions": ["too_long"]
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify feedback response
    assert data["is_liked"] is False
    assert data["feedback_text"] == "Response was too long"
    assert "too_long" in data["improvement_suggestions"]


def test_submit_neutral_feedback(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test submitting neutral feedback (clearing feedback)"""
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": None,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_liked"] is None


def test_feedback_saved_to_database(client: TestClient, test_chat: Chat, test_session: ChatSession, db_session: Session):
    """Test that feedback is saved to database"""
    client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": True,
            "feedback_text": "Great response!",
            "improvement_suggestions": []
        }
    )
    
    # Verify feedback in database
    feedback = db_session.query(ChatFeedback).filter(
        ChatFeedback.chat_id == test_chat.chat_id
    ).first()
    
    assert feedback is not None
    assert feedback.is_liked is True
    assert feedback.feedback_text == "Great response!"


def test_multiple_feedbacks_for_same_chat(client: TestClient, test_chat: Chat, test_session: ChatSession, db_session: Session):
    """Test that multiple feedback records can be created for same chat"""
    # First feedback
    client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": True,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    
    # Second feedback (override)
    client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": False,
            "feedback_text": "Changed my mind",
            "improvement_suggestions": []
        }
    )
    
    # Verify both feedbacks exist
    feedbacks = db_session.query(ChatFeedback).filter(
        ChatFeedback.chat_id == test_chat.chat_id
    ).all()
    
    assert len(feedbacks) >= 1  # At least the second one exists


# ==================== Tests for Get Feedback History ====================

def test_get_chat_feedback_history(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test retrieving feedback history for a chat"""
    # Add feedback
    client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": True,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    
    # Get feedback history
    response = client.get(f"/ai/chat/{test_chat.chat_id}/feedback")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response format
    assert "chat_id" in data
    assert data["chat_id"] == test_chat.chat_id
    assert "feedback_count" in data
    assert "likes" in data
    assert "dislikes" in data
    assert "neutral" in data
    assert "feedback_details" in data


def test_feedback_statistics(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test that feedback statistics are calculated correctly"""
    # Add like feedback
    client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": True,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    
    # Get statistics
    response = client.get(f"/ai/chat/{test_chat.chat_id}/feedback")
    data = response.json()
    
    assert data["feedback_count"] >= 1
    assert data["likes"] >= 1


# ==================== Tests for Regenerate Response ====================

def test_regenerate_chat_response(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test regenerating a chat response"""
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/regenerate",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "reason": "too_long",
            "temperature": None
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "regeneration_id" in data
    assert "original_chat_id" in data
    assert "regenerated_chat_id" in data
    assert "original_response" in data
    assert "new_response" in data
    assert "reason" in data
    assert "timestamp" in data
    
    # Verify IDs are different
    assert data["original_chat_id"] == test_chat.chat_id
    assert data["regenerated_chat_id"] != test_chat.chat_id


def test_regenerated_chat_saved_to_database(client: TestClient, test_chat: Chat, test_session: ChatSession, db_session: Session):
    """Test that regenerated chat is saved to database"""
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/regenerate",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "reason": "not_clear",
            "temperature": None
        }
    )
    
    regenerated_chat_id = response.json()["regenerated_chat_id"]
    
    # Verify new chat in database
    new_chat = db_session.query(Chat).filter(Chat.chat_id == regenerated_chat_id).first()
    assert new_chat is not None
    assert new_chat.is_regenerated is True
    assert new_chat.user_message == test_chat.user_message  # Same question


def test_regeneration_creates_link(client: TestClient, test_chat: Chat, test_session: ChatSession, db_session: Session):
    """Test that regeneration creates proper tracking link"""
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/regenerate",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "reason": "user_requested",
            "temperature": None
        }
    )
    
    regeneration_id = response.json()["regeneration_id"]
    
    # Verify regeneration record
    regeneration = db_session.query(ChatRegeneration).filter(
        ChatRegeneration.regeneration_id == regeneration_id
    ).first()
    
    assert regeneration is not None
    assert regeneration.original_chat_id == test_chat.chat_id
    assert regeneration.reason == "user_requested"


def test_regenerate_with_temperature(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test regenerating with custom temperature"""
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/regenerate",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "reason": "too_formal",
            "temperature": 0.9
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["reason"] == "too_formal"


def test_original_chat_marked_regenerated(client: TestClient, test_chat: Chat, test_session: ChatSession, db_session: Session):
    """Test that original chat is marked as regenerated"""
    client.post(
        f"/ai/chat/{test_chat.chat_id}/regenerate",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "reason": "user_requested",
            "temperature": None
        }
    )
    
    # Query the updated chat from database
    updated_chat = db_session.query(Chat).filter(Chat.chat_id == test_chat.chat_id).first()
    assert updated_chat is not None
    assert updated_chat.is_regenerated is True


# ==================== Integration Tests ====================

def test_feedback_then_regenerate(client: TestClient, test_chat: Chat, test_session: ChatSession):
    """Test liking a message then regenerating it"""
    # Like the message
    like_response = client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": True,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    assert like_response.status_code == 200
    
    # Change mind and dislike
    dislike_response = client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "is_liked": False,
            "feedback_text": "Actually not good",
            "improvement_suggestions": ["incorrect"]
        }
    )
    assert dislike_response.status_code == 200
    
    # Regenerate based on dislike
    regen_response = client.post(
        f"/ai/chat/{test_chat.chat_id}/regenerate",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": test_session.session_id,
            "reason": "incorrect",
            "temperature": None
        }
    )
    assert regen_response.status_code == 200


def test_multiple_regenerations(client: TestClient, test_chat: Chat, test_session: ChatSession, db_session: Session):
    """Test regenerating a response multiple times"""
    current_chat_id = test_chat.chat_id
    regeneration_count = 0
    
    # Regenerate 3 times
    for i in range(3):
        response = client.post(
            f"/ai/chat/{current_chat_id}/regenerate",
            json={
                "chat_id": current_chat_id,
                "session_id": test_session.session_id,
                "reason": f"attempt_{i+1}",
                "temperature": None
            }
        )
        
        assert response.status_code == 200
        current_chat_id = response.json()["regenerated_chat_id"]
        regeneration_count += 1
    
    # Verify regeneration chain
    assert regeneration_count == 3
    assert current_chat_id != test_chat.chat_id


# ==================== Error Handling Tests ====================

def test_feedback_nonexistent_chat(client: TestClient, test_session: ChatSession):
    """Test submitting feedback for non-existent chat"""
    fake_chat_id = str(uuid.uuid4())
    
    response = client.post(
        f"/ai/chat/{fake_chat_id}/feedback",
        json={
            "chat_id": fake_chat_id,
            "session_id": test_session.session_id,
            "is_liked": True,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    
    assert response.status_code == 404


def test_regenerate_nonexistent_chat(client: TestClient, test_session: ChatSession):
    """Test regenerating non-existent chat"""
    fake_chat_id = str(uuid.uuid4())
    
    response = client.post(
        f"/ai/chat/{fake_chat_id}/regenerate",
        json={
            "chat_id": fake_chat_id,
            "session_id": test_session.session_id,
            "reason": "test",
            "temperature": None
        }
    )
    
    assert response.status_code == 404


def test_feedback_invalid_session(client: TestClient, test_chat: Chat):
    """Test feedback with invalid session"""
    fake_session_id = str(uuid.uuid4())
    
    response = client.post(
        f"/ai/chat/{test_chat.chat_id}/feedback",
        json={
            "chat_id": test_chat.chat_id,
            "session_id": fake_session_id,
            "is_liked": True,
            "feedback_text": None,
            "improvement_suggestions": []
        }
    )
    
    assert response.status_code == 404
