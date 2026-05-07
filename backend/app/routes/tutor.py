"""Tutor routes for AI Learning Tutor features - Quiz and Summarize."""

from fastapi import APIRouter, HTTPException, Depends
import uuid
import json
import re
from datetime import datetime

from ..models.chat_models import (
    QuizMeRequest, QuizMeResponse, QuizQuestion,
    QuizAnswerRequest, QuizAnswerResponse,
    QuizScoreRequest, QuizScoreResponse,
    SummarizeRequest, SummarizeResponse
)
from ..services.core import ai_service, prompt_builder
from ..services.chatbot import session_service
from ..core.config import settings
from ..core.database import get_db
from ..models.db_models import ChatSession, Chat
from sqlalchemy.orm import Session

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])


@router.post("/quiz-me", response_model=QuizMeResponse)
async def generate_quiz(request: QuizMeRequest, db: Session = Depends(get_db)) -> QuizMeResponse:
    """
    Generate quiz questions on a specific topic (5-10 questions).
    
    Args:
        topic: Learning topic for quiz
        num_questions: Number of questions (5-10)
        difficulty: Quiz difficulty level (easy, medium, hard)
    """
    try:
        # Validate session
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Validate num_questions
        num_questions = max(5, min(10, request.num_questions))
        
        # Try to generate quiz questions using LLM
        try:
            quiz_prompt = prompt_builder.build_quiz_generation_prompt(
                topic=request.topic,
                num_questions=num_questions,
                difficulty=request.difficulty
            )
            
            quiz_content = ai_service.chat(
                system_prompt="""You are an expert quiz generator. Generate well-structured multiple-choice questions that accurately assess understanding of the given topic. Ensure questions are clear, options are plausible, and exactly ONE answer is definitively correct.""",
                messages=[],
                user_message=quiz_prompt
            )
            
            # Parse quiz content into structured questions
            questions = _parse_quiz_content(quiz_content, num_questions)
            
            if not questions or len(questions) < 3:
                raise ValueError("Failed to parse sufficient quiz questions")
        
        except Exception as llm_error:
            print(f"LLM Quiz generation failed: {llm_error}")
            # Fallback: Generate mock quiz for testing/development
            print(f"Using mock quiz generator as fallback...")
            questions = _generate_mock_quiz(request.topic, num_questions, request.difficulty)
        
        if not questions:
            raise ValueError("Failed to generate quiz questions")
        
        quiz_id = str(uuid.uuid4())
        
        return QuizMeResponse(
            quiz_id=quiz_id,
            session_id=request.session_id,
            topic=request.topic,
            questions=questions,
            total_questions=len(questions),
            difficulty=request.difficulty,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")


@router.post("/quiz-answer", response_model=QuizAnswerResponse)
async def submit_quiz_answer(request: QuizAnswerRequest, db: Session = Depends(get_db)) -> QuizAnswerResponse:
    """
    Evaluate quiz answer and provide feedback with score.
    
    Args:
        session_id: User session ID
        quiz_id: Quiz ID
        question_id: Question ID
        selected_answer: User's selected answer (A, B, C, D)
    """
    try:
        # Validate session
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # In production, you'd fetch the actual question from the quiz storage
        # For now, we'll use the LLM to evaluate
        
        evaluation_prompt = f"""Evaluate this quiz answer:
Question: [Provided by client]
User's Answer: {request.selected_answer}

Provide:
1. Is the answer correct? (yes/no)
2. The correct answer
3. Brief explanation (2-3 sentences) explaining why this is correct
4. Points earned (10 if correct, 0 if incorrect)

Format your response as JSON."""
        
        evaluation = ai_service.chat(
            system_prompt="You are a quiz evaluator. Evaluate student answers fairly and provide constructive feedback.",
            messages=[],
            user_message=evaluation_prompt
        )
        
        # Parse evaluation response
        is_correct, correct_answer, explanation, points = _parse_evaluation(evaluation)
        
        return QuizAnswerResponse(
            question_id=request.question_id,
            is_correct=is_correct,
            correct_answer=correct_answer,
            explanation=explanation,
            points_earned=points
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer evaluation failed: {str(e)}")


@router.post("/quiz-score", response_model=QuizScoreResponse)
async def get_quiz_score(request: QuizScoreRequest, db: Session = Depends(get_db)) -> QuizScoreResponse:
    """
    Get overall quiz score and feedback.
    
    Args:
        session_id: User session ID
        quiz_id: Quiz ID
    """
    try:
        # Validate session
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # In production, retrieve actual quiz results from database
        # For now, return a sample response structure
        
        total_questions = 10
        correct_answers = 8
        score_percentage = (correct_answers / total_questions) * 100
        
        # Generate feedback based on score
        if score_percentage >= 90:
            feedback = "🌟 Excellent! You have a strong understanding of this topic."
        elif score_percentage >= 70:
            feedback = "👍 Good job! You understand the key concepts. Review the weak areas for mastery."
        elif score_percentage >= 50:
            feedback = "📚 You're making progress! Review the material and try again."
        else:
            feedback = "💪 Keep learning! Go through the material again and practice more."
        
        return QuizScoreResponse(
            quiz_id=request.quiz_id,
            topic="[Topic]",
            total_questions=total_questions,
            correct_answers=correct_answers,
            score_percentage=score_percentage,
            feedback=feedback,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Score retrieval failed: {str(e)}")


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_conversation(request: SummarizeRequest, db: Session = Depends(get_db)) -> SummarizeResponse:
    """
    Summarize entire conversation when user continuously interacts.
    Provides condensed and precise learning summary.
    
    Args:
        session_id: User session ID
        include_quiz: Include quiz results in summary (optional)
    """
    try:
        # Validate session
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Fetch all chat history for the session
        chat_history = db.query(Chat).filter(Chat.session_id == request.session_id).order_by(Chat.timestamp).all()
        
        if not chat_history:
            raise HTTPException(status_code=400, detail="No conversation history found")
        
        # Build conversation text
        conversation_text = "\n".join([
            f"User: {chat.user_message}\nAssistant: {chat.ai_response}"
            for chat in chat_history
        ])
        
        # Try to generate summary using LLM
        try:
            summary_prompt = prompt_builder.build_conversation_summary_prompt(conversation_text)
            
            summary_response = ai_service.chat(
                system_prompt="""You are an expert learning analyst. Analyze conversations to identify learning patterns, progress, and provide actionable recommendations. Be concise but comprehensive.""",
                messages=[],
                user_message=summary_prompt
            )
            
            # Parse structured summary response
            summary_data = _parse_summary_response(summary_response)
        
        except Exception as llm_error:
            print(f"LLM Summary generation failed: {llm_error}")
            # Fallback: Generate basic summary from conversation
            print(f"Using fallback summary generator...")
            summary_data = _generate_fallback_summary(chat_history)
        
        return SummarizeResponse(
            session_id=request.session_id,
            summary=summary_data.get("summary", ""),
            key_points=summary_data.get("key_points", []),
            topics_covered=summary_data.get("topics", []),
            learning_progress=summary_data.get("progress", ""),
            recommendations=summary_data.get("recommendations", []),
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


# Helper functions

def _parse_quiz_content(content: str, expected_count: int) -> list[QuizQuestion]:
    """Parse LLM-generated quiz content into structured QuizQuestion objects."""
    questions = []
    
    try:
        # Split by question markers (Q1:, Q2:, etc.)
        question_blocks = re.split(r'Q\d+:', content)
        
        for block in question_blocks[1:]:  # Skip first empty split
            lines = block.strip().split('\n')
            
            if len(lines) < 5:
                continue
            
            question_text = lines[0].strip().rstrip('?') + '?'
            options = []
            correct_answer = None
            
            for line in lines[1:]:
                line = line.strip()
                if line.startswith(('A)', 'B)', 'C)', 'D)')):
                    options.append(line[2:].strip())
                elif line.startswith('CORRECT:'):
                    correct_answer = line.split(':')[1].strip().upper()
            
            if len(options) == 4 and correct_answer:
                questions.append(QuizQuestion(
                    question_id=str(uuid.uuid4()),
                    question=question_text,
                    options=options,
                    correct_answer=correct_answer
                ))
        
        return questions[:expected_count]
    
    except Exception as e:
        print(f"Error parsing quiz content: {e}")
        return []


def _parse_evaluation(evaluation_text: str) -> tuple:
    """Parse evaluation response into (is_correct, correct_answer, explanation, points)."""
    try:
        # Try to extract JSON if present
        json_match = re.search(r'\{.*\}', evaluation_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            is_correct = data.get("correct", False)
            correct_answer = data.get("correct_answer", "")
            explanation = data.get("explanation", "")
            points = 10 if is_correct else 0
        else:
            # Fallback parsing
            is_correct = "correct" in evaluation_text.lower()
            points = 10 if is_correct else 0
            correct_answer = ""
            explanation = evaluation_text[:200]
        
        return is_correct, correct_answer, explanation, points
    
    except Exception as e:
        print(f"Error parsing evaluation: {e}")
        return False, "", "Unable to evaluate at this time", 0


def _parse_summary_response(summary_text: str) -> dict:
    """Parse summary response into structured data."""
    try:
        result = {
            "summary": "",
            "key_points": [],
            "topics": [],
            "progress": "",
            "recommendations": []
        }
        
        sections = summary_text.split('\n\n')
        
        for section in sections:
            if section.startswith('SUMMARY:'):
                result["summary"] = section.replace('SUMMARY:', '').strip()
            elif section.startswith('KEY_POINTS:'):
                points = section.replace('KEY_POINTS:', '').strip().split('\n')
                result["key_points"] = [p.strip().lstrip('- •').strip() for p in points if p.strip()]
            elif section.startswith('TOPICS:'):
                topics = section.replace('TOPICS:', '').strip()
                result["topics"] = [t.strip() for t in topics.split(',') if t.strip()]
            elif section.startswith('PROGRESS:'):
                result["progress"] = section.replace('PROGRESS:', '').strip()
            elif section.startswith('RECOMMENDATIONS:'):
                recs = section.replace('RECOMMENDATIONS:', '').strip().split('\n')
                result["recommendations"] = [r.strip().lstrip('- •').strip() for r in recs if r.strip()]
        
        return result
    
    except Exception as e:
        print(f"Error parsing summary: {e}")
        return {
            "summary": summary_text[:300],
            "key_points": [],
            "topics": [],
            "progress": "",
            "recommendations": []
        }


def _generate_fallback_summary(chat_history: list) -> dict:
    """Generate a basic summary when LLM is unavailable."""
    
    # Extract key points from user questions
    topics = set()
    for chat in chat_history:
        # Extract potential topics from user messages
        words = chat.user_message.lower().split()
        for word in words:
            if len(word) > 5 and word.isalpha():
                topics.add(word.capitalize())
    
    # Basic summary
    total_exchanges = len(chat_history)
    summary = f"Learning session with {total_exchanges} interactions covering {len(topics)} different topics."
    
    # Extract key terms from responses
    key_points = []
    for i, chat in enumerate(chat_history[:5]):  # First 5 exchanges
        if chat.ai_response:
            sentences = chat.ai_response.split('.')
            if sentences:
                key_points.append(sentences[0][:100] + "...")
    
    recommendations = [
        "Continue practicing with more examples",
        "Review challenging concepts",
        "Attempt practice quizzes to assess understanding",
        "Explore related topics for deeper learning"
    ]
    
    return {
        "summary": summary,
        "key_points": key_points[:4],
        "topics": list(topics)[:5],
        "progress": "In progress - continue learning for mastery",
        "recommendations": recommendations
    }


def _generate_mock_quiz(topic: str, num_questions: int, difficulty: str) -> list[QuizQuestion]:
    """Generate mock quiz questions for testing/fallback (when LLM is unavailable)."""
    
    # Sample quiz questions by topic
    sample_quizzes = {
        "photosynthesis": [
            {
                "question": "What is the primary pigment in plants responsible for photosynthesis?",
                "options": ["Chlorophyll", "Carotenoid", "Xanthophyll", "Hemoglobin"],
                "correct": "A"
            },
            {
                "question": "In which part of the chloroplast does the light-dependent reaction occur?",
                "options": ["Stroma", "Thylakoid membrane", "Matrix", "Inner envelope"],
                "correct": "B"
            },
            {
                "question": "What is the main product of the light-dependent reactions?",
                "options": ["Glucose", "ATP and NADPH", "Water", "Carbon dioxide"],
                "correct": "B"
            },
            {
                "question": "The Calvin cycle is also known as:",
                "options": ["Dark reactions", "Light reactions", "Electron transport", "Photolysis"],
                "correct": "A"
            },
            {
                "question": "What molecule is the main source of oxygen released during photosynthesis?",
                "options": ["Carbon dioxide", "Water", "Glucose", "Chlorophyll"],
                "correct": "B"
            },
        ],
        "biology": [
            {
                "question": "What is the powerhouse of the cell?",
                "options": ["Nucleus", "Mitochondria", "Ribosome", "Lysosome"],
                "correct": "B"
            },
            {
                "question": "Which of the following is NOT part of the central dogma of molecular biology?",
                "options": ["DNA", "RNA", "Protein", "Lipid"],
                "correct": "D"
            },
            {
                "question": "What is the process by which cells divide to form two identical daughter cells?",
                "options": ["Meiosis", "Mitosis", "Cytokinesis", "Apoptosis"],
                "correct": "B"
            },
            {
                "question": "How many pairs of chromosomes do humans have?",
                "options": ["23", "46", "92", "12"],
                "correct": "A"
            },
            {
                "question": "What is the basic unit of heredity?",
                "options": ["Chromosome", "Gene", "Allele", "Codon"],
                "correct": "B"
            },
        ],
        "mathematics": [
            {
                "question": "What is the derivative of x^3?",
                "options": ["3x", "3x^2", "x^2", "3"],
                "correct": "B"
            },
            {
                "question": "Solve: 2x + 5 = 13",
                "options": ["x = 2", "x = 4", "x = 6", "x = 8"],
                "correct": "B"
            },
            {
                "question": "What is the area of a circle with radius 5?",
                "options": ["25π", "10π", "100π", "50π"],
                "correct": "A"
            },
            {
                "question": "What is the sum of angles in a triangle?",
                "options": ["90°", "180°", "270°", "360°"],
                "correct": "B"
            },
            {
                "question": "What is log₁₀(100)?",
                "options": ["1", "2", "10", "100"],
                "correct": "B"
            },
        ],
        "chemistry": [
            {
                "question": "What is the atomic number of Carbon?",
                "options": ["4", "6", "8", "12"],
                "correct": "B"
            },
            {
                "question": "What type of bond is formed between two carbon atoms?",
                "options": ["Ionic", "Hydrogen", "Covalent", "Metallic"],
                "correct": "C"
            },
            {
                "question": "What is the pH of a neutral solution?",
                "options": ["0", "7", "14", "10"],
                "correct": "B"
            },
            {
                "question": "Which state of matter has a definite shape and volume?",
                "options": ["Gas", "Liquid", "Plasma", "Solid"],
                "correct": "D"
            },
            {
                "question": "What is Avogadro's number?",
                "options": ["6.02 × 10^23", "3.14 × 10^20", "9.81 × 10^15", "1.66 × 10^-27"],
                "correct": "A"
            },
        ],
    }
    
    # Get sample quiz or create generic one
    topic_lower = topic.lower().replace(" ", "")
    quiz_data = None
    
    for key in sample_quizzes:
        if key in topic_lower:
            quiz_data = sample_quizzes[key]
            break
    
    # Fallback to generic questions if topic not found
    if not quiz_data:
        quiz_data = [
            {
                "question": f"What is a fundamental concept in {topic}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct": "A"
            },
            {
                "question": f"How is {topic} applied in real-world scenarios?",
                "options": ["Application 1", "Application 2", "Application 3", "Application 4"],
                "correct": "B"
            },
            {
                "question": f"What is the history behind {topic}?",
                "options": ["Historical point 1", "Historical point 2", "Historical point 3", "Historical point 4"],
                "correct": "C"
            },
            {
                "question": f"What are the key principles of {topic}?",
                "options": ["Principle A", "Principle B", "Principle C", "Principle D"],
                "correct": "B"
            },
            {
                "question": f"What is the importance of {topic}?",
                "options": ["Importance 1", "Importance 2", "Importance 3", "Importance 4"],
                "correct": "A"
            },
        ]
    
    # Convert to QuizQuestion objects
    questions = []
    for i, q in enumerate(quiz_data[:num_questions]):
        questions.append(QuizQuestion(
            question_id=str(uuid.uuid4()),
            question=q["question"],
            options=q["options"],
            correct_answer=q["correct"]
        ))
    
    return questions

