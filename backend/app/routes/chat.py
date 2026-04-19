"""Chat routes for AI interactions."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import uuid
import time
from datetime import datetime

from ..models.chat_models import (
    ChatRequest, ChatResponse, StreamChatRequest, ChatHistory,
    ChatFeedbackRequest, ChatFeedbackResponse, 
    RegenerateChatRequest, RegeneratedChatResponse
)
from ..services.core import ai_service, prompt_builder, rag_service
from ..services.chatbot import session_service, analytics_service
from ..core.config import settings
from ..core.database import get_db
from ..models.db_models import Chat, ChatFeedback, ChatRegeneration, ChatSession
from sqlalchemy.orm import Session

router = APIRouter(prefix="/ai", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    """
    Chat endpoint for non-streaming responses.
    
    Supports three modes:
    - normal: Standard Q&A
    - teaching: Detailed explanations
    - guiding: Socratic method hints
    """
    try:
        # Validate session from database
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get feedback context from session history to adapt prompts
        feedback_context = ai_service.get_feedback_context(request.session_id, db)
        
        # Build system prompt with feedback adaptation
        system_prompt = prompt_builder.build_system_prompt(
            mode=request.mode,
            feedback_context=feedback_context
        )
        
        # Get conversation context
        context_messages = session_service.get_session_context(
            request.session_id,
            max_messages=settings.MAX_CONTEXT_MESSAGES
        )
        
        # Get AI response
        start_time = time.time()
        ai_response = ai_service.chat(
            system_prompt=system_prompt,
            messages=context_messages,
            user_message=request.message
        )
        response_time = time.time() - start_time
        
        # If API error occurs, provide mock response for testing
        if ai_response.startswith("Error:"):
            ai_response = f"📚 This is a test response to your question: '{request.message[:50]}...'\n\nI'm currently unable to connect to the OpenAI API. Please update your API key in the .env file to enable live responses. For now, you can test the like, dislike, and regenerate buttons with this mock response!"
        
        # Store messages in session
        session_service.add_message_to_session(
            request.session_id, "user", request.message
        )
        session_service.add_message_to_session(
            request.session_id, "assistant", ai_response
        )
        
        # Save chat message to database for feedback tracking
        chat = Chat(
            chat_id=str(uuid.uuid4()),
            session_id=request.session_id,
            user_id=session_obj.user_id,
            user_message=request.message,
            ai_response=ai_response,
            mode=request.mode,
            model="gpt-3.5-turbo",  # Default, can be configured
            tokens_used=None,
            cost=None,
            timestamp=datetime.utcnow()
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        
        # Log analytics
        query_id = str(uuid.uuid4())
        analytics_service.log_query(
            query_id=query_id,
            session_id=request.session_id,
            message=request.message,
            mode=request.mode,
            response_time=response_time
        )
        
        return ChatResponse(
            session_id=request.session_id,
            chat_id=chat.chat_id,
            user_message=request.message,
            ai_response=ai_response,
            mode=request.mode,
            timestamp=datetime.now()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





@router.get("/chat/history/{session_id}", response_model=ChatHistory)
async def get_chat_history(session_id: str) -> ChatHistory:
    """Get complete chat history for a session."""
    try:
        # Validate session
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        messages = session_service.get_session_history(session_id)
        session_info = session_service.get_session_info(session_id)
        
        # Convert to ChatHistory format
        formatted_messages = [
            {
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": datetime.fromisoformat(msg["timestamp"])
            }
            for msg in messages
        ]
        
        return ChatHistory(
            session_id=session_id,
            messages=formatted_messages,
            total_messages=len(messages)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-suggestions")
async def get_quick_suggestions(
    session_id: str,
    concept: str,
    topic_id: str = None
) -> dict:
    """
    Get quick suggestion prompts for expandable chat pop-up.
    
    Perfect for non-intrusive contextual AI support during lessons or quizzes.
    Returns 3-4 quick suggestion prompts like:
    - "Explain this concept"
    - "Give an example"
    - "Simplify this"
    - "How does this relate to..."
    
    Args:
        session_id: Current session ID
        concept: The concept or text to get suggestions for
        topic_id: Optional topic ID for contextual suggestions
        
    Returns:
        List of quick suggestion prompts and their descriptions
    """
    try:
        # Validate session
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Build contextual prompts
        system_prompt = f"""You are a helpful learning assistant providing quick suggestion prompts.
        
Given the concept: "{concept}"
{"and topic: " + topic_id if topic_id else ""}

Generate exactly 4 quick, helpful suggestion prompts that a student might click on.
Each should be concise (under 10 words) and action-oriented.

Format as JSON array with this structure:
[
  {{"text": "Suggestion text", "description": "What this will do"}},
  ...
]"""
        
        suggestions_json = ai_service.chat(
            system_prompt=system_prompt,
            messages=[],
            user_message="Generate quick suggestions"
        )
        
        # Parse suggestions (basic parsing, assume AI returns valid JSON)
        try:
            import json
            suggestions = json.loads(suggestions_json)
        except:
            # Fallback suggestions if parsing fails
            suggestions = [
                {"text": "Explain this", "description": "Get a detailed explanation"},
                {"text": "Give examples", "description": "See practical examples"},
                {"text": "Simplify", "description": "Make it easier to understand"},
                {"text": "Key points", "description": "Focus on main ideas"}
            ]
        
        return {
            "status": "success",
            "session_id": session_id,
            "concept": concept,
            "quick_suggestions": suggestions,
            "timestamp": datetime.now()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contextual")
async def contextual_chat(
    session_id: str,
    message: str,
    lesson_id: str = None,
    quiz_id: str = None,
    context_type: str = "lesson"
):
    """
    Contextual AI support during lessons or quizzes.
    
    Provides intelligent assistance without disrupting the learning flow.
    Perfect for embedding in lesson/quiz UI as non-intrusive expandable chat.
    
    Args:
        session_id: Current session/student ID
        message: Student's question or request
        lesson_id: Current lesson ID (if in lesson)
        quiz_id: Current quiz ID (if taking quiz)
        context_type: "lesson" or "quiz"
        
    Returns:
        AI response contextual to current activity
    """
    try:
        # Validate session
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Build contextual system prompt
        if context_type == "quiz":
            system_prompt = f"""You are a helpful learning assistant supporting a student during a quiz.
            
Quiz ID: {quiz_id}

IMPORTANT GUIDELINES:
- Provide hints but NOT direct answers
- Help clarify the question if student is confused
- Suggest thinking approaches
- Don't give away the answer
- Be encouraging and supportive"""
        else:  # lesson
            system_prompt = f"""You are a patient learning assistant helping during a lesson.
            
Lesson ID: {lesson_id}

GUIDELINES:
- Explain concepts clearly
- Provide examples when helpful
- Check understanding with questions
- Break down complex ideas
- Be encouraging"""
        
        # Get conversation context
        context_messages = session_service.get_session_context(
            session_id,
            max_messages=3  # Shorter context for quick pop-up
        )
        
        # Get AI response
        ai_response = ai_service.chat(
            system_prompt=system_prompt,
            messages=context_messages,
            user_message=message
        )
        
        # Store in session
        session_service.add_message_to_session(session_id, "user", message)
        session_service.add_message_to_session(session_id, "assistant", ai_response)
        
        # Log to analytics
        query_id = str(uuid.uuid4())
        analytics_service.log_query(
            query_id=query_id,
            session_id=session_id,
            message=message,
            mode="contextual_help",
            response_time=0
        )
        
        return {
            "status": "success",
            "session_id": session_id,
            "response": ai_response,
            "context_type": context_type,
            "context_id": lesson_id or quiz_id,
            "timestamp": datetime.now(),
            "non_intrusive": True
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Feedback & Regeneration Endpoints ====================

@router.post("/chat/{chat_id}/feedback", response_model=ChatFeedbackResponse)
async def submit_chat_feedback(
    chat_id: str,
    feedback: ChatFeedbackRequest,
    db: Session = Depends(get_db)
) -> ChatFeedbackResponse:
    """
    Submit feedback (like/dislike) on an AI response.
    
    Helps improve AI responses and train the system based on user preferences.
    """
    try:
        # Validate session from database
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == feedback.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Validate chat exists
        chat = db.query(Chat).filter(Chat.chat_id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat message not found")
        
        # Create feedback record
        chat_feedback = ChatFeedback(
            chat_id=chat_id,
            user_id=chat.user_id,
            session_id=feedback.session_id,
            is_liked=feedback.is_liked,
            feedback_text=feedback.feedback_text,
            improvement_suggestions=feedback.improvement_suggestions or []
        )
        
        db.add(chat_feedback)
        db.commit()
        db.refresh(chat_feedback)
        
        # Log analytics for feedback
        analytics_service.log_query(
            query_id=str(uuid.uuid4()),
            session_id=feedback.session_id,
            message=f"Feedback: {'liked' if feedback.is_liked else 'disliked' if feedback.is_liked == False else 'neutral'}",
            mode="feedback",
            response_time=0
        )
        
        return ChatFeedbackResponse(
            feedback_id=chat_feedback.feedback_id,
            chat_id=chat_feedback.chat_id,
            is_liked=chat_feedback.is_liked,
            feedback_text=chat_feedback.feedback_text,
            improvement_suggestions=chat_feedback.improvement_suggestions,
            created_at=chat_feedback.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/{chat_id}/regenerate", response_model=RegeneratedChatResponse)
async def regenerate_response(
    chat_id: str,
    request: RegenerateChatRequest,
    db: Session = Depends(get_db)
) -> RegeneratedChatResponse:
    """
    Regenerate an AI response with different parameters.
    
    Useful when the user is not satisfied with the initial response.
    Can adjust temperature for more creative or conservative responses.
    """
    try:
        # Validate session from database
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Validate and get original chat
        original_chat = db.query(Chat).filter(Chat.chat_id == chat_id).first()
        if not original_chat:
            raise HTTPException(status_code=404, detail="Chat message not found")
        
        # Build system prompt with regeneration hint
        system_prompt = prompt_builder.build_system_prompt(
            mode=original_chat.mode,
            lesson_context=f"Regenerating response - Previous feedback: {request.reason or 'User requested new response'}"
        )
        
        # Generate new response with optional temperature adjustment
        # For regeneration, we use the original user message directly without full context
        start_time = time.time()
        new_ai_response = ai_service.chat(
            system_prompt=system_prompt,
            messages=[],  # Empty context for regeneration, focusing on the single message
            user_message=original_chat.user_message
            # Note: temperature adjustment would be handled by ai_service if supported
        )
        response_time = time.time() - start_time
        
        # Create new chat record for regenerated response
        new_chat = Chat(
            session_id=request.session_id,
            user_id=original_chat.user_id,
            topic_id=original_chat.topic_id,
            user_message=original_chat.user_message,
            ai_response=new_ai_response,
            mode=original_chat.mode,
            model=original_chat.model,
            is_regenerated=True,
            regeneration_count=original_chat.regeneration_count + 1
        )
        
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        # Create regeneration record
        regeneration = ChatRegeneration(
            original_chat_id=chat_id,
            regenerated_chat_id=new_chat.chat_id,
            user_id=original_chat.user_id,
            session_id=request.session_id,
            reason=request.reason,
            temperature_adjustment=request.temperature,
            tokens_used=new_chat.tokens_used,
            cost=new_chat.cost
        )
        
        db.add(regeneration)
        db.commit()
        db.refresh(regeneration)
        
        # Update original chat to mark it as regenerated
        # Refetch to avoid detached instance issues
        original_chat_to_update = db.query(Chat).filter(Chat.chat_id == chat_id).first()
        if original_chat_to_update:
            original_chat_to_update.is_regenerated = True
            original_chat_to_update.regeneration_count = original_chat_to_update.regeneration_count + 1
            db.commit()
        
        # Log analytics
        analytics_service.log_query(
            query_id=str(uuid.uuid4()),
            session_id=request.session_id,
            message=f"Regenerate: {request.reason or 'user requested'}",
            mode=f"regenerate_{original_chat.mode}",
            response_time=response_time
        )
        
        return RegeneratedChatResponse(
            regeneration_id=regeneration.regeneration_id,
            original_chat_id=chat_id,
            regenerated_chat_id=new_chat.chat_id,
            original_response=original_chat.ai_response,
            new_response=new_ai_response,
            reason=request.reason,
            tokens_used=new_chat.tokens_used,
            cost=new_chat.cost,
            timestamp=datetime.now()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/{chat_id}/feedback")
async def get_chat_feedback(
    chat_id: str,
    db: Session = Depends(get_db)
) -> dict:
    """Get feedback history for a specific chat message."""
    try:
        # Get chat
        chat = db.query(Chat).filter(Chat.chat_id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat message not found")
        
        # Get all feedback for this chat
        feedbacks = db.query(ChatFeedback).filter(ChatFeedback.chat_id == chat_id).all()
        
        return {
            "chat_id": chat_id,
            "feedback_count": len(feedbacks),
            "likes": sum(1 for f in feedbacks if f.is_liked == True),
            "dislikes": sum(1 for f in feedbacks if f.is_liked == False),
            "neutral": sum(1 for f in feedbacks if f.is_liked is None),
            "feedback_details": [
                {
                    "feedback_id": f.feedback_id,
                    "is_liked": f.is_liked,
                    "feedback_text": f.feedback_text,
                    "improvement_suggestions": f.improvement_suggestions,
                    "created_at": f.created_at
                }
                for f in feedbacks
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
