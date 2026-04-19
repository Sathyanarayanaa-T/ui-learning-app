"""Adaptive learning and AI-driven personalization endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..services.tutor import (
    get_adaptive_learning_path,
    generate_feedback,
    get_difficulty_adjustment
)

router = APIRouter(prefix="/adaptive", tags=["Adaptive Learning"])


class AssessmentRequest(BaseModel):
    """Assessment request."""
    topic_id: str
    score: float
    time_spent_seconds: int


class DifficultyAdjustmentRequest(BaseModel):
    """Request to adjust learning difficulty."""
    current_difficulty: str
    last_score: float


@router.post("/next-topic")
async def get_next_appropriate_topic(
    user_id: str = "demo-user",
    current_topic: str = None,
    db: Session = Depends(get_db)
):
    """
    Get the next appropriate topic based on user progress and learning patterns.
    
    Uses adaptive algorithms to recommend topics that match user's current level.
    """
    try:
        learning_path = get_adaptive_learning_path(user_id, db)
        return {
            "status": "success",
            "learning_path": learning_path,
            "recommendation_reason": "Based on your progress and learning pace"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assess")
async def assess_user_understanding(
    request: AssessmentRequest,
    user_id: str = "demo-user",
    db: Session = Depends(get_db)
):
    """
    Assess user's understanding of a topic and get personalized feedback.
    
    - **topic_id**: Topic being assessed
    - **score**: User's performance score (0-100)
    - **time_spent_seconds**: Time spent on topic
    
    Returns adaptive feedback and next steps.
    """
    try:
        feedback = await generate_feedback(
            user_id=user_id,
            topic_id=request.topic_id,
            db=db
        )
        return {
            "status": "success",
            "feedback": feedback,
            "recommendation": "Feedback based on your performance"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adjust-difficulty")
async def adjust_learning_difficulty(
    request: DifficultyAdjustmentRequest,
    user_id: str = "demo-user",
    db: Session = Depends(get_db)
):
    """
    Automatically adjust learning difficulty based on performance.
    
    - **current_difficulty**: Current difficulty level
    - **last_score**: Last assessment score
    
    Returns new difficulty level and adjusted content.
    """
    try:
        adjustment = get_difficulty_adjustment(
            user_id=user_id,
            current_difficulty=request.current_difficulty,
            last_score=request.last_score,
            db=db
        )
        return {
            "status": "success",
            "new_difficulty": adjustment["new_difficulty"],
            "reason": adjustment["reason"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
