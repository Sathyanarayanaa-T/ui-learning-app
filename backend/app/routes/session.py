"""Session management routes."""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid

from ..models.session_models import SessionCreateResponse, SessionInfo
from ..services.chatbot import session_service
from ..core.config import settings
from ..core.database import get_db
from ..models.db_models import ChatSession, User
from sqlalchemy.orm import Session

router = APIRouter(prefix="/session", tags=["Session"])


@router.post("/create", response_model=SessionCreateResponse)
async def create_session(db: Session = Depends(get_db)) -> SessionCreateResponse:
    """Create a new chat session and save to database."""
    try:
        session_id = str(uuid.uuid4())
        
        # Create or get a default/anonymous user for this session
        anonymous_user_id = "anonymous_user"
        user = db.query(User).filter(User.user_id == anonymous_user_id).first()
        
        if not user:
            # Create default anonymous user if it doesn't exist
            user = User(
                user_id=anonymous_user_id,
                username="anonymous",
                email="anonymous@session.local",
                skill_level="beginner"
            )
            db.add(user)
            db.commit()
        
        # Create session in memory for session_service
        session_service.create_session(session_id)
        
        # Save to database with valid user_id
        db_session = ChatSession(
            session_id=session_id,
            user_id=anonymous_user_id,  # Use the anonymous user
            mode="normal",
            started_at=datetime.utcnow()
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        return SessionCreateResponse(
            session_id=session_id,
            created_at=db_session.started_at.isoformat() if db_session.started_at else datetime.utcnow().isoformat(),
            status="active"
        )
    
    except Exception as e:
        db.rollback()
        print(f"Session creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

