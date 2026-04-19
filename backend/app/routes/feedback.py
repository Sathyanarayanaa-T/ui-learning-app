"""AI-driven feedback endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..services.tutor import (
    generate_feedback,
    get_recent_feedback
)
from ..services.core import ai_service
from datetime import datetime

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/{user_id}/{topic_id}")
async def generate_feedback_endpoint(user_id: str, topic_id: str, db: Session = Depends(get_db)):
    """Generate AI feedback for user performance."""
    try:
        feedback = await generate_feedback(user_id, topic_id, db)
        return {"status": "success", "data": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_feedback(user_id: str, limit: int = 5, db: Session = Depends(get_db)):
    """Get recent feedback for user."""
    try:
        feedbacks = get_recent_feedback(user_id, db, limit)
        return {"status": "success", "data": feedbacks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/performance-gap/{user_id}")
async def analyze_learning_gaps(
    user_id: str,
    topic_id: str,
    current_score: float,
    target_score: float = 80.0,
    db: Session = Depends(get_db)
):
    """
    AI-driven feedback on performance gaps and learning recommendations.
    
    Analyzes the gap between current and target performance and provides
    personalized feedback on specific areas to improve.
    
    Args:
        user_id: Student ID
        topic_id: Topic being assessed
        current_score: Student's current score (0-100)
        target_score: Target score to achieve (default 80)
        
    Returns:
        Detailed performance gap analysis with improvement recommendations
    """
    try:
        # Create contextual prompt for gap analysis
        score_gap = target_score - current_score
        
        system_prompt = f"""You are an expert educational analyst providing personalized feedback.
        
Student Performance Analysis:
- Topic: {topic_id}
- Current Score: {current_score}%
- Target Score: {target_score}%
- Gap to Close: {score_gap}% ({"underperforming" if score_gap > 0 else "exceeding target"})

Provide a detailed analysis including:
1. Specific strengths demonstrated
2. Key areas needing improvement
3. Likely causes of the performance gap
4. 3-4 specific, actionable recommendations
5. Estimated effort to reach target

Be encouraging but honest. Focus on growth."""

        feedback_response = ai_service.chat(
            system_prompt=system_prompt,
            messages=[],
            user_message="Analyze performance gap and provide recommendations"
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "topic_id": topic_id,
            "current_score": current_score,
            "target_score": target_score,
            "score_gap": score_gap,
            "feedback": feedback_response,
            "feedback_type": "performance_gap_analysis",
            "generated_at": datetime.now()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/strengths-weaknesses/{user_id}")
async def get_strengths_weaknesses(
    user_id: str,
    topic_id: str,
    recent_scores: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """
    Get AI-powered analysis of student's strengths and weaknesses.
    
    Perfect for personalized learning recommendations and adaptive
    difficulty adjustment.
    
    Args:
        user_id: Student ID
        topic_id: Topic to analyze
        recent_scores: Dict with recent attempt scores
        
    Returns:
        Detailed strengths/weaknesses analysis
    """
    try:
        system_prompt = f"""You are an educational expert analyzing student learning patterns.
        
Analyze the student's performance in {topic_id} and identify:

1. **Strengths**: Concepts they grasp well, skills demonstrated
2. **Weaknesses**: Concepts they struggle with, gaps in understanding
3. **Learning Style**: How they learn best based on performance patterns
4. **Next Steps**: What to focus on for maximum improvement

Provide concrete, specific feedback that can guide personalized learning."""

        analysis = ai_service.chat(
            system_prompt=system_prompt,
            messages=[],
            user_message="Provide strengths and weaknesses analysis"
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "topic_id": topic_id,
            "analysis": analysis,
            "use_cases": [
                "Personalized learning path adjustment",
                "Difficulty level recommendation",
                "Content recommendation",
                "Study guidance"
            ],
            "generated_at": datetime.now()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
