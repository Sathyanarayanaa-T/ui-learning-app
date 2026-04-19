"""Progress tracking endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..services.tutor import (
    update_user_progress,
    batch_update_progress,
    get_user_statistics,
    get_topic_progress
)

router = APIRouter(prefix="/progress", tags=["Progress Tracking"])


class ProgressUpdate(BaseModel):
    """Single question attempt."""
    user_id: str
    topic_id: str
    is_correct: bool


class QuizResult(BaseModel):
    """Quiz with multiple questions."""
    user_id: str
    topic_id: str
    correct_answers: int
    total_questions: int


@router.post("/update")
async def update_progress(request: ProgressUpdate, db: Session = Depends(get_db)):
    """Update progress for a single question attempt."""
    try:
        result = update_user_progress(
            request.user_id,
            request.topic_id,
            request.is_correct,
            db
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quiz-result")
async def save_quiz_result(request: QuizResult, db: Session = Depends(get_db)):
    """Save quiz results (batch update)."""
    try:
        result = batch_update_progress(
            request.user_id,
            request.topic_id,
            request.correct_answers,
            request.total_questions,
            db
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{user_id}")
async def get_stats(user_id: str, db: Session = Depends(get_db)):
    """Get overall user learning statistics."""
    try:
        stats = get_user_statistics(user_id, db)
        return {"status": "success", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/{topic_id}")
async def get_progress(user_id: str, topic_id: str, db: Session = Depends(get_db)):
    """Get specific topic progress."""
    try:
        progress = get_topic_progress(user_id, topic_id, db)
        return {"status": "success", "data": progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
