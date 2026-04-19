"""Progress Tracking Service - Manages user learning progress - Tutor Service."""

from sqlalchemy.orm import Session
from sqlalchemy import func
from ...models.db_models import UserProgress, User, SkillLevel
from datetime import datetime


def update_user_progress(user_id: str, topic_id: str, is_correct: bool, db: Session) -> dict:
    """
    Update user progress after a quiz attempt.
    
    Args:
        user_id: User identifier
        topic_id: Topic identifier
        is_correct: Whether the answer was correct
        db: Database session
        
    Returns:
        Updated progress information
    """
    
    # Fetch or create progress record
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.topic_id == topic_id
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=user_id,
            topic_id=topic_id,
            score=0.0,
            attempts=0,
            correct_answers=0,
            total_questions=0
        )
        db.add(progress)
    
    # Update attempt counters
    progress.attempts = (progress.attempts or 0) + 1
    progress.total_questions = (progress.total_questions or 0) + 1
    
    if is_correct:
        progress.correct_answers = (progress.correct_answers or 0) + 1
    
    # Calculate score percentage
    progress.score = (progress.correct_answers / progress.total_questions) * 100 if progress.total_questions > 0 else 0
    progress.last_attempted = datetime.utcnow()
    progress.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(progress)
    
    return {
        "progress_id": progress.progress_id,
        "topic_id": progress.topic_id,
        "score": round(progress.score, 2),
        "attempts": progress.attempts,
        "correct_answers": progress.correct_answers,
        "total_questions": progress.total_questions
    }


def batch_update_progress(user_id: str, topic_id: str, correct: int, total: int, db: Session) -> dict:
    """
    Batch update progress for multiple questions.
    
    Args:
        user_id: User identifier
        topic_id: Topic identifier
        correct: Number of correct answers
        total: Total number of questions
        db: Database session
        
    Returns:
        Updated progress information
    """
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.topic_id == topic_id
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=user_id,
            topic_id=topic_id,
            score=0.0,
            attempts=0,
            correct_answers=0,
            total_questions=0
        )
        db.add(progress)
    
    progress.attempts = (progress.attempts or 0) + 1
    progress.correct_answers = (progress.correct_answers or 0) + correct
    progress.total_questions = (progress.total_questions or 0) + total
    progress.score = (progress.correct_answers / progress.total_questions) * 100 if progress.total_questions > 0 else 0
    progress.last_attempted = datetime.utcnow()
    progress.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(progress)
    
    return {
        "progress_id": progress.progress_id,
        "topic_id": progress.topic_id,
        "score": round(progress.score, 2),
        "attempts": progress.attempts,
        "correct_answers": progress.correct_answers,
        "total_questions": progress.total_questions
    }


def get_user_statistics(user_id: str, db: Session) -> dict:
    """
    Get overall user learning statistics.
    
    Args:
        user_id: User identifier
        db: Database session
        
    Returns:
        Comprehensive user statistics
    """
    
    progress_records = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).all()
    
    if not progress_records:
        return {
            "user_id": user_id,
            "total_topics": 0,
            "avg_score": 0.0,
            "total_attempts": 0,
            "total_correct": 0,
            "total_questions": 0,
            "mastered_topics": 0,
            "in_progress_topics": 0
        }
    
    total_attempts = sum((p.attempts or 0) for p in progress_records)
    total_correct = sum((p.correct_answers or 0) for p in progress_records)
    total_questions = sum((p.total_questions or 0) for p in progress_records)
    
    # Calculate average score
    avg_score = sum((p.score or 0) for p in progress_records) / len(progress_records) if progress_records else 0
    
    # Count mastered topics (score >= 85)
    mastered = len([p for p in progress_records if (p.score or 0) >= 85])
    
    # Count in-progress topics (60 <= score < 85)
    in_progress = len([p for p in progress_records if 60 <= (p.score or 0) < 85])
    
    return {
        "user_id": user_id,
        "total_topics": len(progress_records),
        "avg_score": round(avg_score, 2),
        "total_attempts": total_attempts,
        "total_correct": total_correct,
        "total_questions": total_questions,
        "accuracy": round((total_correct / total_questions * 100) if total_questions > 0 else 0, 2),
        "mastered_topics": mastered,
        "in_progress_topics": in_progress,
        "needs_review_topics": len(progress_records) - mastered - in_progress
    }


def get_topic_progress(user_id: str, topic_id: str, db: Session) -> dict:
    """
    Get detailed progress for a specific topic.
    
    Args:
        user_id: User identifier
        topic_id: Topic identifier
        db: Database session
        
    Returns:
        Topic-specific progress details
    """
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.topic_id == topic_id
    ).first()
    
    if not progress:
        return {
            "topic_id": topic_id,
            "status": "not_started",
            "score": 0.0,
            "attempts": 0
        }
    
    return {
        "topic_id": topic_id,
        "status": "mastered" if progress.score >= 85 else ("in_progress" if progress.score >= 60 else "needs_review"),
        "score": round(progress.score, 2),
        "attempts": progress.attempts,
        "correct_answers": progress.correct_answers,
        "total_questions": progress.total_questions,
        "last_attempted": progress.last_attempted
    }
