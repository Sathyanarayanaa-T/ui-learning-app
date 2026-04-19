"""Learning path and personalized learning roadmap endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..services.tutor import generate_learning_path

router = APIRouter(prefix="/learning-path", tags=["Learning Path"])


class LearningPathRequest(BaseModel):
    """Request to generate a learning path."""
    goal: str
    duration_days: int = 30


class LearningPathResponse(BaseModel):
    """Learning path response."""
    user_id: str
    goal: str
    duration: dict
    difficulty_progression: list
    daily_schedule: list
    milestones: list
    success_criteria: dict


@router.post("/generate", response_model=dict)
async def create_learning_path(
    request: LearningPathRequest,
    user_id: str = "demo-user",
    db: Session = Depends(get_db)
):
    """
    Generate a personalized learning path based on user goals.
    
    - **goal**: Learning objective (e.g., "Master Data Structures")
    - **duration_days**: How many days for the learning path
    
    Returns a structured learning roadmap with daily topics and milestones.
    """
    try:
        learning_path = generate_learning_path(
            user_id=user_id,
            goal=request.goal,
            duration_days=request.duration_days,
            db=db
        )
        return {
            "status": "success",
            "data": learning_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/goal/{goal}", response_model=dict)
async def get_learning_path_for_goal(
    goal: str,
    duration_days: int = 30,
    user_id: str = "demo-user",
    db: Session = Depends(get_db)
):
    """
    Get a learning path for a specific goal.
    
    Returns learning roadmap with daily tasks and progress milestones.
    """
    try:
        learning_path = generate_learning_path(
            user_id=user_id,
            goal=goal,
            duration_days=duration_days,
            db=db
        )
        return {
            "status": "success",
            "data": learning_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
