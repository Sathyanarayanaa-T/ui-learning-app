# Context Builder Service - Builds intelligent context for AI from user data
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...models.db_models import User, SkillLevel, UserProgress, Chat


def get_user_context(user_id: str, topic_id: str, db: Session) -> dict:
    """
    Build comprehensive context about user for AI personalization.
    
    Args:
        user_id: User identifier
        topic_id: Current topic being studied
        db: Database session
        
    Returns:
        Dictionary with user context data for prompt enhancement
    """
    
    # Fetch user profile
    user = db.query(User).filter(User.user_id == user_id).first()
    user_level = user.skill_level if user else SkillLevel.BEGINNER
    
    # Get user's performance in current topic
    current_topic_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.topic_id == topic_id
    ).first()
    
    current_topic_score = current_topic_progress.score if current_topic_progress else 0.0
    current_topic_attempts = current_topic_progress.attempts if current_topic_progress else 0
    
    # Get all topics - identify weak areas (score < 60)
    all_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).all()
    
    weak_topics = [p.topic_id for p in all_progress if p.score < 60]
    strong_topics = [p.topic_id for p in all_progress if p.score >= 80]
    
    # Get recent activity (last 5 chats)
    recent_chats = db.query(Chat).filter(
        Chat.user_id == user_id
    ).order_by(Chat.timestamp.desc()).limit(5).all()
    
    recent_topics = [chat.topic_id for chat in recent_chats]
    
    # Calculate overall performance
    total_score = db.query(func.avg(UserProgress.score)).filter(
        UserProgress.user_id == user_id
    ).scalar() or 0.0
    
    context = {
        "user_id": user_id,
        "skill_level": user_level,
        "current_topic_id": topic_id,
        "current_topic_score": current_topic_score,
        "current_topic_attempts": current_topic_attempts,
        "weak_areas": weak_topics,
        "strong_areas": strong_topics,
        "recent_topics": recent_topics,
        "overall_performance": round(total_score, 2),
        "total_topics_studied": len(all_progress)
    }
    
    return context


def format_user_context_for_prompt(context: dict) -> str:
    """Format user context object for injection into system prompt."""
    formatted = f"""Student Profile:
- Skill Level: {context.get('skill_level', 'beginner')}
- Overall Performance: {context.get('overall_performance', 0)}%
- Topics Studied: {context.get('total_topics_studied', 0)}
- Current Topic Score: {context.get('current_topic_score', 0)}%
- Attempts on Current Topic: {context.get('current_topic_attempts', 0)}"""
    
    if context.get('weak_areas'):
        formatted += f"\n- Areas Needing Improvement: {', '.join(context['weak_areas'][:3])}"
    
    if context.get('strong_areas'):
        formatted += f"\n- Strong Areas: {', '.join(context['strong_areas'][:3])}"
    
    return formatted
