"""Proactive support and AI-driven notifications endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from ..core.database import get_db
from ..services.tutor import (
    generate_nudges,
    check_user_engagement,
    send_proactive_message
)
from ..services.core import ai_service
from ..models.db_models import UserProgress

router = APIRouter(prefix="/proactive", tags=["Proactive Support"])


class NudgeResponse(BaseModel):
    """Proactive nudge response."""
    message: str
    type: str
    action: str
    priority: str


@router.post("/progress-based-nudges/{user_id}")
async def get_progress_based_nudges(
    user_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Generate progress-based nudges and reminders.
    
    Analyzes user's learning progress and generates personalized nudges:
    - Topics not practiced recently (reminder)
    - Topics with low scores (review suggestion)
    - Strong topics (achievement recognition)
    - Next recommended topics (progression nudge)
    
    Returns list of nudges ordered by priority.
    """
    try:
        nudges = generate_nudges(user_id, db)
        
        if not nudges:
            nudges = [
                {
                    "type": "encouragement",
                    "message": "Ready to continue learning? Pick a topic to explore!",
                    "priority": "low"
                }
            ]
        
        return {
            "status": "success",
            "user_id": user_id,
            "nudges": nudges,
            "total_nudges": len(nudges),
            "generated_at": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/engagement-level/{user_id}")
async def get_engagement_level(
    user_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """
    Check user engagement level and get proactive suggestions.
    
    Returns engagement metrics and AI-generated suggestions to re-engage
    users who may be falling behind or losing motivation.
    
    Engagement Levels:
    - High: Active daily
    - Moderate: Few times a week
    - Low: Less than 3 days ago
    - Inactive: No activity in 7+ days
    """
    try:
        engagement = check_user_engagement(user_id, db)
        
        # Generate engagement-based nudges
        level = engagement.get("engagement_level", "unknown")
        
        engagement_nudges = {
            "inactive": {
                "message": "We miss you! Your learning goals need attention. Come back and make progress!",
                "urgency": "high",
                "action": "resume_learning"
            },
            "low": {
                "message": "Your progress is good! Let's build momentum. Try the next topic.",
                "urgency": "medium",
                "action": "continue_learning"
            },
            "moderate": {
                "message": "Great consistency! Keep up the momentum with daily practice.",
                "urgency": "low",
                "action": "maintain_streak"
            },
            "high": {
                "message": "Amazing dedication! You're on track to reach your goals!",
                "urgency": "none",
                "action": "celebrate"
            }
        }
        
        nudge = engagement_nudges.get(
            level,
            {"message": "Ready to learn?", "urgency": "low", "action": "learn"}
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "engagement": engagement,
            "nudge": nudge,
            "recommendations": {
                "high": "Challenging new topics or projects",
                "moderate": "Regular practice and goal-setting",
                "low": "Motivational support and reminder prompts",
                "inactive": "Incentives, reset, and comeback challenges"
            }.get(level, "Personalized learning path"),
            "generated_at": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smart-reminders/{user_id}")
async def get_smart_reminders(
    user_id: str,
    include_streak: bool = True,
    include_pending: bool = True,
    db: Session = Depends(get_db)
) -> dict:
    """
    Get smart, personalized learning reminders based on progress.
    
    Generates timely reminders for:
    - Overdue practice topics
    - Low-performing areas
    - Learning streaks (maintain consistency)
    - Pending quiz/assignments
    - Topics close to mastery
    
    Args:
        user_id: Student ID
        include_streak: Include streak/consistency reminders
        include_pending: Include pending assignments
        
    Returns:
        Prioritized list of smart reminders
    """
    try:
        # Get user progress
        progress_records = db.query(UserProgress).filter(
            UserProgress.user_id == user_id
        ).all()
        
        reminders = []
        
        # Check each topic's status
        for progress in progress_records:
            # Low score reminder
            if (progress.score or 0) < 70:
                reminders.append({
                    "type": "review_needed",
                    "topic": progress.topic_id,
                    "score": progress.score,
                    "message": f"Review '{progress.topic_id}' - Your score ({progress.score:.0f}%) needs improvement",
                    "priority": "high",
                    "action": "review"
                })
            
            # Close to mastery reminder
            elif (progress.score or 0) >= 80 and (progress.score or 0) < 95:
                reminders.append({
                    "type": "close_to_mastery",
                    "topic": progress.topic_id,
                    "score": progress.score,
                    "message": f"Almost mastered '{progress.topic_id}'! One more practice to reach 95%",
                    "priority": "medium",
                    "action": "practice_once_more"
                })
        
        # Streak reminder
        if include_streak and progress_records:
            reminders.append({
                "type": "streak",
                "message": "Don't break your learning streak! Practice today to maintain consistency.",
                "priority": "medium",
                "action": "practice_daily"
            })
        
        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        reminders.sort(key=lambda x: priority_order.get(x.get("priority"), 3))
        
        return {
            "status": "success",
            "user_id": user_id,
            "reminders": reminders,
            "total_reminders": len(reminders),
            "generated_at": datetime.now()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/motivational-nudge/{user_id}")
async def get_motivational_nudge(
    user_id: str,
    include_achievements: bool = True,
    db: Session = Depends(get_db)
) -> dict:
    """
    Get AI-generated motivational message based on progress.
    
    Generates personalized motivation including:
    - Progress celebration
    - Achievement recognition
    - Encouragement for weak areas
    - Next milestone preview
    
    Perfect for non-intrusive nudges during learning sessions.
    """
    try:
        # Get user progress summary
        progress_records = db.query(UserProgress).filter(
            UserProgress.user_id == user_id
        ).all()
        
        if not progress_records:
            return {
                "status": "success",
                "message": "Welcome to your learning journey! Ready to get started?",
                "type": "welcome",
                "generated_at": datetime.now()
            }
        
        # Build progress context
        avg_score = sum(p.score or 0 for p in progress_records) / len(progress_records)
        completed_topics = len([p for p in progress_records if (p.score or 0) >= 80])
        total_topics = len(progress_records)
        
        system_prompt = f"""Generate a brief, motivational message for a student based on their progress.

Progress Summary:
- Average Score: {avg_score:.1f}%
- Topics Completed: {completed_topics}/{total_topics}
- Total Attempts: {sum(p.attempts or 0 for p in progress_records)}

Guidelines:
- Be encouraging and specific
- Reference their achievements
- Mention next steps
- Keep it to 1-2 sentences
- Make it personal and genuine"""

        motivation_message = ai_service.chat(
            system_prompt=system_prompt,
            messages=[],
            user_message="Generate motivational message"
        )
        
        return {
            "status": "success",
            "user_id": user_id,
            "message": motivation_message,
            "progress_summary": {
                "average_score": avg_score,
                "completed_topics": completed_topics,
                "total_topics": total_topics,
                "completion_percentage": (completed_topics / total_topics * 100) if total_topics > 0 else 0
            },
            "type": "motivational",
            "generated_at": datetime.now()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
