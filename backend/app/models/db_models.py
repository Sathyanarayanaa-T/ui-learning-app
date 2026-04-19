"""SQLAlchemy database models for all features."""

from sqlalchemy import Column, String, Text, DateTime, Integer, Float, Boolean, Enum as SQLEnum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..core.database import Base
from datetime import datetime
import uuid
import enum


# Enums
class SkillLevel(str, enum.Enum):
    """User skill level classification."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class LearningMode(str, enum.Enum):
    """Learning mode types."""
    TEACHING = "teaching"
    GUIDING = "guiding"
    NORMAL = "normal"


# User Models
class User(Base):
    """User profile storing learner information."""
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    skill_level = Column(SQLEnum(SkillLevel), default=SkillLevel.BEGINNER, nullable=False)
    preferences = Column(JSON, default={})  # Store user preferences
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress_records = relationship("UserProgress", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    chats = relationship("Chat", back_populates="user")


class UserProgress(Base):
    """Tracks user performance in different topics."""
    __tablename__ = "user_progress"

    progress_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    topic_id = Column(String, nullable=False, index=True)
    score = Column(Float, default=0.0)  # Percentage (0-100)
    attempts = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    time_spent = Column(Integer, default=0)  # In seconds
    last_attempted = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="progress_records")


# Chat & Session Models
class ChatSession(Base):
    """Session management for chat interactions."""
    __tablename__ = "chat_sessions"

    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    mode = Column(SQLEnum(LearningMode), default=LearningMode.NORMAL)
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    context = Column(JSON, default={})  # Store session context
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("Chat", back_populates="session")


class Chat(Base):
    """Individual chat messages."""
    __tablename__ = "chats"

    chat_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.session_id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    topic_id = Column(String, nullable=True, index=True)  # Optional topic context
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)
    mode = Column(SQLEnum(LearningMode), default=LearningMode.NORMAL)
    model = Column(String, nullable=True)  # GPT model used
    tokens_used = Column(Integer, nullable=True)
    cost = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_regenerated = Column(Boolean, default=False)  # Track if response is regenerated
    regeneration_count = Column(Integer, default=0)  # Count regenerations
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    user = relationship("User", back_populates="chats")
    feedback = relationship("ChatFeedback", back_populates="chat", cascade="all, delete-orphan")
    regenerations = relationship(
        "ChatRegeneration",
        back_populates="original_chat",
        foreign_keys="[ChatRegeneration.original_chat_id]",
        primaryjoin="Chat.chat_id==ChatRegeneration.original_chat_id"
    )


# Document Models (for RAG)
class Document(Base):
    """Uploaded documents for RAG."""
    __tablename__ = "documents"

    document_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    file_path = Column(String, nullable=True)
    document_type = Column(String, default="text")  # pdf, txt, docx, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    doc_metadata = Column(JSON, default={})  # Store additional metadata


# Learning Path & Topic Models  
class Topic(Base):
    """Learning topics/subjects."""
    __tablename__ = "topics"

    topic_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    difficulty_level = Column(SQLEnum(SkillLevel), default=SkillLevel.BEGINNER)
    prerequisites = Column(JSON, default=[])  # List of prerequisite topic IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LearningPath(Base):
    """Recommended learning paths for users."""
    __tablename__ = "learning_paths"

    path_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    topics = Column(JSON, nullable=False)  # List of topic IDs
    recommended_at = Column(DateTime, default=datetime.utcnow)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Recommendation(Base):
    """Personalized learning recommendations."""
    __tablename__ = "recommendations"

    recommendation_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    topic_id = Column(String, ForeignKey("topics.topic_id"), nullable=False, index=True)
    recommendation_type = Column(String, nullable=False)  # review, practice, new_topic
    reason = Column(Text, nullable=True)  # Why this recommendation
    confidence_score = Column(Float, default=0.0)  # 0-1 confidence level
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# Quiz & Feedback Models
class Quiz(Base):
    """Quiz models and questions."""
    __tablename__ = "quizzes"

    quiz_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String, ForeignKey("topics.topic_id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    questions = Column(JSON, nullable=False)  # List of questions with options
    passing_score = Column(Float, default=70.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class QuizResult(Base):
    """Results of quiz attempts."""
    __tablename__ = "quiz_results"

    result_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.quiz_id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    answers = Column(JSON, nullable=False)
    time_taken = Column(Integer, nullable=True)  # In seconds
    passed = Column(Boolean, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    """AI feedback on user performance."""
    __tablename__ = "feedbacks"

    feedback_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    topic_id = Column(String, ForeignKey("topics.topic_id"), nullable=False, index=True)
    feedback_type = Column(String, nullable=False)  # performance, learning_gap, strength
    content = Column(Text, nullable=False)
    severity = Column(String, default="info")  # info, warning, critical
    created_at = Column(DateTime, default=datetime.utcnow)


# Chat Feedback Models (Like/Dislike)
class ChatFeedback(Base):
    """User feedback on AI responses (like/dislike)."""
    __tablename__ = "chat_feedbacks"

    feedback_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chat_id = Column(String, ForeignKey("chats.chat_id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.session_id"), nullable=False, index=True)
    is_liked = Column(Boolean, nullable=True)  # True=like, False=dislike, None=neutral
    feedback_text = Column(Text, nullable=True)  # Optional user comment
    improvement_suggestions = Column(JSON, default=[])  # Tags: too_long, not_clear, incorrect, etc.
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chat = relationship("Chat", back_populates="feedback")
    user = relationship("User")
    session = relationship("ChatSession")


class ChatRegeneration(Base):
    """Track regenerated responses from user requests."""
    __tablename__ = "chat_regenerations"

    regeneration_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_chat_id = Column(String, ForeignKey("chats.chat_id"), nullable=False, index=True)
    regenerated_chat_id = Column(String, ForeignKey("chats.chat_id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.session_id"), nullable=False, index=True)
    reason = Column(String, nullable=True)  # User's reason for regeneration (e.g., "too_long", "not_clear")
    temperature_adjustment = Column(Float, nullable=True)  # Temperature used for regeneration
    tokens_used = Column(Integer, nullable=True)
    cost = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    original_chat = relationship("Chat", foreign_keys=[original_chat_id])
    user = relationship("User")
    session = relationship("ChatSession")


# Analytics Models
class Analytics(Base):
    """User activity analytics."""
    __tablename__ = "analytics"

    analytics_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.session_id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    endpoint = Column(String, nullable=False)
    query = Column(Text, nullable=False)
    response_time = Column(Float, nullable=True)  # In milliseconds
    tokens_used = Column(Integer, nullable=True)
    cost = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


# Notification/Nudge Models (for proactive support)
class Nudge(Base):
    """Proactive nudges and reminders for users."""
    __tablename__ = "nudges"

    nudge_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    nudge_type = Column(String, nullable=False)  # reminder, achievement, suggestion
    message = Column(Text, nullable=False)
    context = Column(JSON, default={})  # Topic, progress info, etc.
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
