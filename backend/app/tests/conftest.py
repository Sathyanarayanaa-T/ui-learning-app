import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add parent directory to path for imports
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.main import app
from app.core.database import Base, get_db
from app.models.db_models import (
    User, ChatSession, Chat, ChatFeedback, ChatRegeneration,
    Document, Topic, LearningPath, Recommendation
)


# Create test database
@pytest.fixture(scope="session")
def test_db():
    """Create a test database"""
    db_fd, db_path = tempfile.mkstemp()
    database_url = f"sqlite:///{db_path}"
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    os.close(db_fd)
    # Try to delete with retry
    try:
        os.unlink(db_path)
    except (OSError, PermissionError):
        # File might still be in use on Windows
        import time
        time.sleep(0.5)
        try:
            os.unlink(db_path)
        except:
            pass  # Best effort


@pytest.fixture(scope="function")
def db_session(test_db):
    """Create a new database session for each test"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db, expire_on_commit=False)
    connection = test_db.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create test client with test database"""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        user_id="test_user_123",
        username="testuser",
        email="test@example.com",
        skill_level="beginner"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_session(db_session, test_user):
    """Create a test session"""
    session_obj = ChatSession(
        session_id="test_session_123",
        user_id=test_user.user_id,
        mode="normal"
    )
    db_session.add(session_obj)
    db_session.commit()
    db_session.refresh(session_obj)
    return session_obj


@pytest.fixture
def test_topic(db_session):
    """Create a test topic"""
    topic = Topic(
        name="Python Basics",
        description="Introduction to Python programming",
        difficulty_level="beginner"
    )
    db_session.add(topic)
    db_session.commit()
    db_session.refresh(topic)
    return topic
