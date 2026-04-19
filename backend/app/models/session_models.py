from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionCreateRequest(BaseModel):
    """Request model for creating a new session."""
    pass  # No parameters needed - session is auto-created


class SessionCreateResponse(BaseModel):
    """Response model for session creation."""
    session_id: str
    created_at: datetime
    status: str = "active"


class SessionInfo(BaseModel):
    """Session information."""
    session_id: str
    created_at: datetime
    last_activity: datetime
    message_count: int
    status: str


class AnalyticsRequest(BaseModel):
    """Request for analytics endpoint."""
    session_id: Optional[str] = None
    user_id: Optional[str] = None


class QueryLog(BaseModel):
    """Log entry for user queries."""
    query_id: str
    session_id: str
    message: str
    mode: str
    response_time: float
    timestamp: datetime


class AnalyticsResponse(BaseModel):
    """Analytics data response."""
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    total_queries: int
    mode_usage: dict  # {"teaching": 5, "guiding": 3, "normal": 2}
    avg_response_time: float
    topics_discussed: list[str]
