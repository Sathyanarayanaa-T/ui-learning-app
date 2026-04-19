"""Analytics routes for tracking and insights."""

from fastapi import APIRouter, HTTPException

from ..models.session_models import AnalyticsResponse
from ..services.chatbot import analytics_service, session_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])





@router.get("/session/{session_id}")
async def get_session_analytics(session_id: str):
    """Get analytics for a specific session."""
    try:
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        analytics = analytics_service.get_session_analytics(session_id)
        return analytics
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/global")
async def get_global_analytics():
    """Get global platform analytics."""
    try:
        analytics = analytics_service.get_global_analytics()
        return analytics
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_expired_sessions():
    """Clean up expired sessions (administrative endpoint)."""
    try:
        from ..core.config import settings
        session_service.cleanup_expired_sessions(settings.SESSION_TIMEOUT)
        
        return {
            "message": "Session cleanup completed",
            "timeout_seconds": settings.SESSION_TIMEOUT
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
