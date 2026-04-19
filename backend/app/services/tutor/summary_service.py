"""Summary Service - Generates study notes and summaries - Tutor Service."""

from ..core.ai_service import ai_service
from ..core.prompt_builder import prompt_builder
from datetime import datetime
from typing import Dict, List


def generate_study_summary(content: str, summary_type: str = "short", context: Dict = None) -> Dict:
    """
    Generate a summary/notes from content using AI.
    
    Args:
        content: Content to summarize (lesson, explanation, etc.)
        summary_type: Type of summary (short, detailed, bullet_points)
        context: User context for personalization
        
    Returns:
        Generated summary with metadata
    """
    
    prompt = prompt_builder.build_summary_prompt(content, summary_type)
    
    summary_text = ai_service.chat(
        system_prompt="You are an expert at creating concise, clear summaries.",
        messages=[],
        user_message=prompt
    )
    
    result = {
        "original_length": len(content.split()),
        "summary_type": summary_type,
        "summary": summary_text,
        "key_points": extract_key_points(summary_text),
        "generated_at": datetime.utcnow().isoformat()
    }
    
    return result


def extract_key_points(summary: str) -> List[str]:
    """
    Extract bullet points from summary.
    
    Args:
        summary: Summary text
        
    Returns:
        List of key points
    """
    
    lines = summary.split("\n")
    key_points = [
        line.strip() for line in lines if line.strip() and 
        (line.strip().startswith(("•", "-", "*")) or 
         (len(line.strip()) > 0 and line.strip()[0].isdigit()))
    ]
    
    return key_points[:10]  # Top 10 points


def create_study_notes(topic: str, depth: str = "medium", context: Dict = None) -> Dict:
    """
    Create comprehensive study notes for a topic.
    
    Args:
        topic: Topic to create notes for
        depth: Depth of notes (light, medium, detailed)
        context: User context for personalization
        
    Returns:
        Generated notes with sections
    """
    
    prompt = f"""Create {depth} study notes on the topic: {topic}
    
Include:
- Main concepts and definitions
- Key points and explanations
- Examples and applications
- Review questions

Format clearly with sections and bullet points."""
    
    notes_text = ai_service.chat(
        system_prompt="You are an expert tutor creating comprehensive study notes.",
        messages=[],
        user_message=prompt
    )
    
    return {
        "topic": topic,
        "depth": depth,
        "notes": notes_text,
        "sections": extract_sections(notes_text),
        "created_at": datetime.utcnow().isoformat()
    }


def extract_sections(notes: str) -> List[Dict]:
    """
    Extract sections from notes.
    
    Args:
        notes: Notes text
        
    Returns:
        List of sections with content
    """
    lines = notes.split("\n")
    sections = []
    current_section = None
    
    for line in lines:
        if line.startswith("#"):
            current_section = line.replace("#", "").strip()
            sections.append({"title": current_section, "content": []})
        elif sections and line.strip():
            sections[-1]["content"].append(line.strip())
    
    return sections


def generate_flashcard_set(topic: str, count: int = 10, db = None) -> Dict:
    """
    Generate flashcard set for spaced repetition learning.
    
    Args:
        topic: Topic for flashcards
        count: Number of flashcards
        db: Database session
        
    Returns:
        Set of flashcards
    """
    
    prompt = f"""Create {count} flashcards for the topic: {topic}
    
Format each flashcard as:
Q: [Question]
A: [Answer]

Make questions clear and answers concise."""
    
    flashcards_text = ai_service.chat(
        system_prompt="You are an expert tutor creating educational flashcards.",
        messages=[],
        user_message=prompt
    )
    
    return {
        "topic": topic,
        "count": count,
        "flashcards": flashcards_text,
        "created_at": datetime.utcnow().isoformat()
    }
