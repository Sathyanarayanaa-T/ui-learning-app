"""Proactive Service - Generates nudges and engagement reminders - Tutor Service."""

from sqlalchemy.orm import Session
from ...models.db_models import Nudge, UserProgress, Recommendation
from datetime import datetime, timedelta


def generate_nudges(user_id: str, db: Session) -> list:
    """
    Generate contextual nudges based on user activity.
    
    Args:
        user_id: User identifier
        db: Database session
        
    Returns:
        List of generated nudges
    """
    
    nudges_generated = []
    
    # Check for overdue topics
    progress_records = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).all()
    
    now = datetime.utcnow()
    
    for progress in progress_records:
        # Nudge for unfinished topics (low scores)
        if progress.last_attempted and (now - progress.last_attempted) > timedelta(days=3):
            if (progress.score or 0) < 75:
                nudge = Nudge(
                    user_id=user_id,
                    nudge_type="reminder",
                    message=f"Haven't practiced '{progress.topic_id}' in a while. Score: {progress.score:.1f}%",
                    context={"topic_id": progress.topic_id, "score": progress.score}
                )
                db.add(nudge)
                nudges_generated.append({
                    "type": "reminder",
                    "message": nudge.message,
                    "topic_id": progress.topic_id
                })
    
    # Check for pending recommendations
    pending_recs = db.query(Recommendation).filter(
        Recommendation.user_id == user_id,
        Recommendation.acknowledged == False
    ).all()
    
    if pending_recs:
        for rec in pending_recs[:2]:  # Top 2 suggestions
            nudge = Nudge(
                user_id=user_id,
                nudge_type="suggestion",
                message=rec.reason,
                context={"topic_id": rec.topic_id, "recommendation_type": rec.recommendation_type}
            )
            db.add(nudge)
            nudges_generated.append({
                "type": "suggestion",
                "message": rec.reason,
                "topic_id": rec.topic_id
            })
    
    # Achievement nudges
    strong_topics = [p for p in progress_records if (p.score or 0) >= 90]
    if strong_topics:
        first_achievement = strong_topics[0]
        nudge = Nudge(
            user_id=user_id,
            nudge_type="achievement",
            message=f"Great job! You achieved 90%+ in '{first_achievement.topic_id}'!",
            context={"topic_id": first_achievement.topic_id, "score": first_achievement.score}
        )
        db.add(nudge)
        nudges_generated.append({
            "type": "achievement",
            "message": nudge.message,
            "topic_id": first_achievement.topic_id
        })
    
    db.commit()
    return nudges_generated


def check_user_engagement(user_id: str, db: Session) -> dict:
    """
    Check user engagement level and activity.
    
    Args:
        user_id: User identifier
        db: Database session
        
    Returns:
        Engagement metrics
    """
    
    progress_records = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).all()
    
    if not progress_records:
        return {
            "user_id": user_id,
            "engagement_level": "inactive",
            "last_activity": None,
            "days_since_activity": None
        }
    
    # Get last activity
    last_activity = max(p.last_attempted for p in progress_records if p.last_attempted)
    days_since = (datetime.utcnow() - last_activity).days if last_activity else None
    
    # Determine engagement level
    if days_since is None or days_since > 7:
        engagement = "inactive"
    elif days_since > 3:
        engagement = "low"
    elif days_since > 1:
        engagement = "moderate"
    else:
        engagement = "high"
    
    return {
        "user_id": user_id,
        "engagement_level": engagement,
        "last_activity": last_activity,
        "days_since_activity": days_since,
        "topics_studied": len(progress_records),
        "average_score": sum(p.score or 0 for p in progress_records) / len(progress_records)
    }


def send_proactive_message(user_id: str, message_type: str = "reminder") -> dict:
    """
    Send proactive message to user.
    
    Args:
        user_id: User identifier
        message_type: Type of message (reminder, motivation, suggestion)
        
    Returns:
        Message sent status
    """
    
    messages = {
        "reminder": "It's been a while! Continue your learning journey.",
        "motivation": "Great progress! Keep up the momentum.",
        "suggestion": "Based on your performance, we recommend reviewing your weak areas."
    }
    
    return {
        "user_id": user_id,
        "message_type": message_type,
        "message": messages.get(message_type, "Continue your learning!"),
        "sent_at": datetime.utcnow().isoformat()
    }


def get_active_nudges(user_id: str, db: Session) -> list:
    """
    Get all unacknowledged nudges for a user.
    
    Args:
        user_id: User identifier
        db: Database session
        
    Returns:
        List of active nudges
    """
    
    nudges = db.query(Nudge).filter(
        Nudge.user_id == user_id,
        Nudge.acknowledged == False
    ).order_by(Nudge.created_at.desc()).all()
    
    return [
        {
            "nudge_id": nudge.nudge_id,
            "type": nudge.nudge_type,
            "message": nudge.message,
            "context": nudge.context,
            "created_at": nudge.created_at
        }
        for nudge in nudges
    ]


def acknowledge_nudge(nudge_id: str, db: Session) -> dict:
    """
    Mark a nudge as acknowledged.
    
    Args:
        nudge_id: Nudge identifier
        db: Database session
        
    Returns:
        Acknowledgment status
    """
    
    nudge = db.query(Nudge).filter(Nudge.nudge_id == nudge_id).first()
    
    if not nudge:
        return {"error": "Nudge not found"}
    
    nudge.acknowledged = True
    nudge.acknowledged_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "nudge_id": nudge_id}
