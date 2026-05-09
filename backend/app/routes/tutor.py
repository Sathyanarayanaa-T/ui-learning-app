"""Tutor routes for AI Learning Tutor features - Quiz and Summarize."""

from fastapi import APIRouter, HTTPException, Depends
import uuid
import json
import re
import random
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
            print(f"Using fallback quiz generator (faster)...")
            questions = _generate_mock_quiz(request.topic, num_questions, request.difficulty)
        
        # Hide correct answers from user response (only sent for storage, not to frontend)
        response_questions = []
        for question in questions:
            response_questions.append(QuizQuestion(
                question_id=question.question_id,
                question=question.question,
                options=question.options,
                correct_answer=None  # Hidden from user
            ))
        
        # Store the quiz with answers in session for evaluation later
        quiz_id = str(uuid.uuid4())
        _store_quiz_in_session(request.session_id, quiz_id, questions, topic=request.topic, difficulty=request.difficulty)
        
        return QuizMeResponse(
            quiz_id=quiz_id,
            session_id=request.session_id,
            topic=request.topic,
            questions=response_questions,
            total_questions=len(response_questions),
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
        selected_answer: User's selected answer (a, b, c, d)
    """
    try:
        # Validate session
        session_obj = db.query(ChatSession).filter(ChatSession.session_id == request.session_id).first()
        if not session_obj:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Normalize the selected answer - handle both full text and just letter
        user_answer = request.selected_answer.strip().lower()
        
        # If it contains ")", it's like "a) Option text" - extract just the letter
        if ")" in user_answer:
            user_answer = user_answer.split(")")[0].strip()
        
        # Remove trailing ")" if present
        user_answer = user_answer.rstrip(')')
        
        # Retrieve stored quiz data with correct answers
        stored_quiz = _get_quiz_from_session(request.session_id, request.quiz_id)
        
        if not stored_quiz:
            raise HTTPException(status_code=404, detail="Quiz not found in session. Please regenerate quiz.")
        
        # Find the question in the stored quiz
        correct_answer = None
        for q in stored_quiz.get("questions", []):
            if q["question_id"] == request.question_id:
                correct_answer = q["correct_answer"]
                break
        
        if correct_answer is None:
            raise HTTPException(status_code=404, detail="Question not found in quiz")
        
        # Normalize correct answer for comparison
        correct_answer_normalized = correct_answer.strip().lower().rstrip(')')
        
        # Direct comparison
        is_correct = user_answer == correct_answer_normalized
        
        # Generate explanation
        explanation_prompt = f"""Quiz question: [The question text would go here]
Selected answer: {user_answer.upper()}
Correct answer: {correct_answer_normalized.upper()}
Is correct: {is_correct}

Provide a brief 1-2 sentence explanation of why this answer is {('correct' if is_correct else 'incorrect')}.
Be educational and constructive."""
        
        explanation = ai_service.chat(
            system_prompt="You are a quiz educator. Provide brief, clear explanations for quiz answers.",
            messages=[],
            user_message=explanation_prompt
        )
        
        points = 10 if is_correct else 0
        
        # Store the answer for score calculation
        _store_quiz_answer(request.session_id, request.quiz_id, request.question_id, is_correct)
        
        return QuizAnswerResponse(
            question_id=request.question_id,
            is_correct=is_correct,
            correct_answer=correct_answer_normalized,
            explanation=explanation.strip()[:300],
            points_earned=points
        )
    
    except HTTPException:
        raise
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
        
        # Retrieve stored quiz and answer data
        quiz_data = _get_quiz_from_session(request.session_id, request.quiz_id)
        if not quiz_data:
            raise HTTPException(status_code=404, detail="Quiz not found in session")
        
        # Get stored answers for this quiz
        answers_data = _get_quiz_answers(request.session_id, request.quiz_id)
        
        # Calculate score
        total_questions = len(quiz_data.get("questions", []))
        correct_answers = 0
        
        if answers_data:
            for answer in answers_data.get("answers", []):
                if answer.get("is_correct"):
                    correct_answers += 1
        
        # Calculate percentage
        score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        
        # Get topic from stored quiz
        topic = quiz_data.get("topic", "Quiz")
        
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
            topic=topic,
            total_questions=total_questions,
            correct_answers=correct_answers,
            score_percentage=score_percentage,
            feedback=feedback,
            timestamp=datetime.utcnow()
        )
    
    except HTTPException:
        raise
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
        question_blocks = re.split(r'(?:^|\n)\s*Q\d+:', content, flags=re.MULTILINE)
        
        for block in question_blocks[1:]:  # Skip first empty split
            lines = [line.strip() for line in block.strip().split('\n') if line.strip()]
            
            if len(lines) < 5:
                continue
            
            question_text = lines[0]
            # Ensure question ends with ?
            if not question_text.endswith('?'):
                question_text = question_text.rstrip('.') + '?'
            
            options = []
            correct_answer = None
            explanation = ""
            
            for i, line in enumerate(lines[1:]):
                # Extract options
                if re.match(r'^[A-Da-d]\)', line):
                    option_text = re.sub(r'^[A-Da-d]\)\s*', '', line).strip()
                    # Reject placeholder options
                    if option_text and not re.match(r'^(Option|Application|Principle|Importance|Historical point|Point)\s+[A-D]$', option_text, re.IGNORECASE):
                        options.append(option_text)
                    else:
                        options.append(option_text)  # Keep even if placeholder for now, will filter later
                # Extract correct answer
                elif line.startswith('CORRECT:'):
                    correct_answer = line.split(':')[1].strip().upper()
                # Extract explanation
                elif line.startswith('EXPLANATION:'):
                    explanation = line.split(':', 1)[1].strip()
            
            # Validate question has 4 distinct options and a correct answer
            if len(options) == 4 and correct_answer and correct_answer in ['A', 'B', 'C', 'D']:
                # Check if options are not all placeholders
                has_real_content = any(
                    len(opt) > 10 and not opt.startswith('Option') 
                    for opt in options
                )
                
                if has_real_content or all(len(opt) > 2 for opt in options):
                    # Add a), b), c), d) labels to options (lowercase)
                    labeled_options = [f"{chr(97 + idx)}) {opt}" for idx, opt in enumerate(options)]
                    
                    # Convert correct answer to lowercase
                    correct_answer_lower = correct_answer.lower()
                    
                    questions.append(QuizQuestion(
                        question_id=str(uuid.uuid4()),
                        question=question_text,
                        options=labeled_options,
                        correct_answer=correct_answer_lower  # Store internally, will be hidden in response
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


def _generate_contextual_quiz_fallback(topic: str, num_questions: int, difficulty: str) -> list:
    """
    Generate contextual quiz questions on-the-fly for any topic using LLM.
    This is a fallback when the hardcoded quiz data isn't available.
    """
    try:
        # Try to use LLM to generate contextual questions
        from ..services.core import ai_service
        
        contextual_prompt = f"""You are an expert quiz generator for the topic: "{topic}"

Generate exactly {num_questions} multiple-choice questions at {difficulty} difficulty level.

IMPORTANT REQUIREMENTS:
1. Create REAL, CONTEXTUAL options - NEVER use generic placeholders like "Option A", "Option B"
2. All options must be SPECIFIC and RELEVANT to "{topic}"
3. Create plausible but clearly distinct distractors
4. Exactly ONE answer is definitively correct

Format (STRICT - MUST FOLLOW EXACTLY):
Q1: [Specific question about {topic}?]
A) [Real, specific option for {topic}]
B) [Real, specific option for {topic}]
C) [Real, specific option for {topic}]
D) [Real, specific option for {topic}]
CORRECT: [A/B/C/D]

Q2: [Next question...]
A) ...
[Continue for all {num_questions} questions]

Generate {num_questions} high-quality questions now. Remember: NO placeholder text!"""
        
        response = ai_service.chat(
            system_prompt="You are an expert quiz generator. Create detailed, contextual questions with real options specific to the given topic.",
            messages=[],
            user_message=contextual_prompt
        )
        
        questions = _parse_quiz_content(response, num_questions)
        if questions and len(questions) >= 3:
            return questions
    except Exception as e:
        print(f"Contextual quiz generation failed: {e}")
    
    # Fallback: Generate static questions if LLM contextual generation also fails
    return _generate_generic_quiz_questions(topic, num_questions, difficulty)


def _generate_generic_quiz_questions(topic: str, num_questions: int, difficulty: str) -> list:
    """
    Generate generic but contextual quiz questions when LLM is unavailable.
    Creates real questions about the topic instead of placeholders.
    """
    
    # Generate a variety of question types about the topic
    question_templates = [
        {
            "template": "What is a key characteristic of {topic}?",
            "options_template": ["Cross-platform code reusability", "Server-side rendering capability", "Machine learning integration", "Database management"],
            "correct_idx": 0
        },
        {
            "template": "Which of the following is an important aspect of {topic}?",
            "options_template": ["Native module compilation", "JavaScript runtime execution", "Hardware acceleration", "API gateway configuration"],
            "correct_idx": 1
        },
        {
            "template": "What is a primary use case of {topic}?",
            "options_template": ["Building mobile applications for iOS and Android", "Creating web servers", "Managing cloud infrastructure", "Data science and analytics"],
            "correct_idx": 0
        },
        {
            "template": "How does {topic} improve development efficiency?",
            "options_template": ["Write once, run everywhere approach", "Manual platform-specific coding", "Assembly language optimization", "Hardware-level debugging"],
            "correct_idx": 0
        },
        {
            "template": "What is one of the primary advantages of {topic}?",
            "options_template": ["Faster time-to-market", "Reduced code complexity", "Enhanced runtime performance", "Lower hardware costs"],
            "correct_idx": 0
        },
        {
            "template": "Which development paradigm does {topic} primarily use?",
            "options_template": ["Component-based architecture", "Procedural programming", "Functional reactive programming", "Object-oriented inheritance"],
            "correct_idx": 0
        },
    ]
    
    questions = []
    
    for i in range(min(num_questions, len(question_templates))):
        template = question_templates[i % len(question_templates)]
        question_text = template["template"].format(topic=topic)
        
        # Get correct option BEFORE shuffling
        correct_option = template["options_template"][template["correct_idx"]]
        
        # Create contextual options and shuffle
        options = template["options_template"].copy()
        random.shuffle(options)
        
        # Find where correct option ended up after shuffle
        correct_index = options.index(correct_option)
        correct_letter = chr(97 + correct_index)  # Convert index to a, b, c, d (lowercase)
        
        # Add a), b), c), d) labels to options (lowercase)
        labeled_options = [f"{chr(97 + idx)}) {opt}" for idx, opt in enumerate(options)]
        
        questions.append({
            "question": question_text,
            "options": labeled_options,
            "correct": correct_letter
        })
    
    return questions



def _generate_mock_quiz(topic: str, num_questions: int, difficulty: str) -> list:
    """Generate mock quiz questions for testing/fallback (when LLM is unavailable)."""
    
    # Sample quiz questions by topic
    sample_quizzes = {
        "photosynthesis": [
            {
                "question": "What is the primary pigment in plants responsible for photosynthesis?",
                "options": ["Chlorophyll", "Carotenoid", "Xanthophyll", "Hemoglobin"],
                "correct": "a"
            },
            {
                "question": "In which part of the chloroplast does the light-dependent reaction occur?",
                "options": ["Stroma", "Thylakoid membrane", "Matrix", "Inner envelope"],
                "correct": "b"
            },
            {
                "question": "What is the main product of the light-dependent reactions?",
                "options": ["Glucose", "ATP and NADPH", "Water", "Carbon dioxide"],
                "correct": "b"
            },
            {
                "question": "The Calvin cycle is also known as:",
                "options": ["Dark reactions", "Light reactions", "Electron transport", "Photolysis"],
                "correct": "a"
            },
            {
                "question": "What molecule is the main source of oxygen released during photosynthesis?",
                "options": ["Carbon dioxide", "Water", "Glucose", "Chlorophyll"],
                "correct": "b"
            },
        ],
        "biology": [
            {
                "question": "What is the powerhouse of the cell?",
                "options": ["Nucleus", "Mitochondria", "Ribosome", "Lysosome"],
                "correct": "b"
            },
            {
                "question": "Which of the following is NOT part of the central dogma of molecular biology?",
                "options": ["DNA", "RNA", "Protein", "Lipid"],
                "correct": "d"
            },
            {
                "question": "What is the process by which cells divide to form two identical daughter cells?",
                "options": ["Meiosis", "Mitosis", "Cytokinesis", "Apoptosis"],
                "correct": "b"
            },
            {
                "question": "How many pairs of chromosomes do humans have?",
                "options": ["23", "46", "92", "12"],
                "correct": "a"
            },
            {
                "question": "What is the basic unit of heredity?",
                "options": ["Chromosome", "Gene", "Allele", "Codon"],
                "correct": "b"
            },
        ],
        "mathematics": [
            {
                "question": "What is the derivative of x^3?",
                "options": ["3x", "3x^2", "x^2", "3"],
                "correct": "b"
            },
            {
                "question": "Solve: 2x + 5 = 13",
                "options": ["x = 2", "x = 4", "x = 6", "x = 8"],
                "correct": "b"
            },
            {
                "question": "What is the area of a circle with radius 5?",
                "options": ["25π", "10π", "100π", "50π"],
                "correct": "a"
            },
            {
                "question": "What is the sum of angles in a triangle?",
                "options": ["90°", "180°", "270°", "360°"],
                "correct": "b"
            },
            {
                "question": "What is log₁₀(100)?",
                "options": ["1", "2", "10", "100"],
                "correct": "b"
            },
        ],
        "chemistry": [
            {
                "question": "What is the atomic number of Carbon?",
                "options": ["4", "6", "8", "12"],
                "correct": "b"
            },
            {
                "question": "What type of bond is formed between two carbon atoms?",
                "options": ["Ionic", "Hydrogen", "Covalent", "Metallic"],
                "correct": "c"
            },
            {
                "question": "What is the pH of a neutral solution?",
                "options": ["0", "7", "14", "10"],
                "correct": "b"
            },
            {
                "question": "Which state of matter has a definite shape and volume?",
                "options": ["Gas", "Liquid", "Plasma", "Solid"],
                "correct": "d"
            },
            {
                "question": "What is Avogadro's number?",
                "options": ["6.02 × 10^23", "3.14 × 10^20", "9.81 × 10^15", "1.66 × 10^-27"],
                "correct": "a"
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
    
    # Fallback to contextual generator if topic not found
    if not quiz_data:
        quiz_data = _generate_contextual_quiz_fallback(topic, num_questions, difficulty)
    
    # Convert to QuizQuestion objects
    questions = []
    for i, q in enumerate(quiz_data[:num_questions]):
        # Add a), b), c), d) labels to options (lowercase)
        labeled_options = [f"{chr(97 + idx)}) {opt}" for idx, opt in enumerate(q["options"])]
        
        questions.append(QuizQuestion(
            question_id=str(uuid.uuid4()),
            question=q["question"],
            options=labeled_options,
            correct_answer=q["correct"]  # Store internally for evaluation
        ))
    
    return questions


# Simple in-memory quiz storage (in production, use database)
_quiz_storage = {}


def _store_quiz_in_session(session_id: str, quiz_id: str, questions: list[QuizQuestion], topic: str = "", difficulty: str = "") -> None:
    """Store quiz questions with answers for evaluation."""
    key = f"{session_id}:{quiz_id}"
    _quiz_storage[key] = {
        "topic": topic,
        "difficulty": difficulty,
        "questions": [
            {
                "question_id": q.question_id,
                "question": q.question,
                "options": q.options,
                "correct_answer": q.correct_answer
            }
            for q in questions
        ],
        "answers": []  # Track submitted answers
    }


def _get_quiz_from_session(session_id: str, quiz_id: str) -> dict:
    """Retrieve stored quiz questions with answers."""
    key = f"{session_id}:{quiz_id}"
    return _quiz_storage.get(key)


def _store_quiz_answer(session_id: str, quiz_id: str, question_id: str, is_correct: bool) -> None:
    """Store the answer for a question to track score."""
    key = f"{session_id}:{quiz_id}"
    if key in _quiz_storage:
        _quiz_storage[key]["answers"].append({
            "question_id": question_id,
            "is_correct": is_correct
        })


def _get_quiz_answers(session_id: str, quiz_id: str) -> dict:
    """Retrieve all answers submitted for a quiz."""
    key = f"{session_id}:{quiz_id}"
    if key in _quiz_storage:
        return {"answers": _quiz_storage[key].get("answers", [])}
    return {"answers": []}


