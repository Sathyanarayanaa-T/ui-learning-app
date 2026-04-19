"""Personalized learning recommendations endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..services.tutor import (
    generate_recommendations,
    get_recommendations,
    acknowledge_recommendation
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


class AcknowledgeRequest(BaseModel):
    """Acknowledge a recommendation."""
    recommendation_id: str


@router.post("/{user_id}/generate")
async def generate_recs(user_id: str, db: Session = Depends(get_db)):
    """Generate recommendations for user."""
    try:
        recs = await generate_recommendations(user_id, db)
        return {"status": "success", "data": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user_recommendations(user_id: str, db: Session = Depends(get_db)):
    """Get active recommendations for user."""
    try:
        recs = get_recommendations(user_id, db)
        return {"status": "success", "data": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/acknowledge/{recommendation_id}")
async def acknowledge_rec(recommendation_id: str, db: Session = Depends(get_db)):
    """Mark recommendation as acknowledged."""
    try:
        result = acknowledge_recommendation(recommendation_id, db)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
