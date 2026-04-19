"""Voice routes for speech-to-text and text-to-speech."""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
import uuid
import os
import time
from io import BytesIO

from ..services.core import ai_service, prompt_builder
from ..services.chatbot import session_service, analytics_service
from ..core.config import settings

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    **Step 1: Transcribe Audio to Text**
    
    User speaks → Upload audio file → Get transcribed text
    
    Accepts: MP3, WAV, M4A, OGG, FLAC, PCM
    Returns: Transcribed text that user can review and confirm
    """
    temp_file_path = None
    try:
        if not settings.ENABLE_VOICE:
            raise HTTPException(status_code=503, detail="Voice features are disabled")
        
        # Create temporary file
        temp_file_path = f"temp_{uuid.uuid4()}.wav"
        
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            contents = await file.read()
            buffer.write(contents)
        
        # Transcribe using Whisper
        transcribed_text = ai_service.transcribe_audio(temp_file_path)
        
        # Delete temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        return {
            "status": "success",
            "transcribed_text": transcribed_text,
            "file_name": file.filename,
            "timestamp": time.time()
        }
    
    except HTTPException:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise
    except Exception as e:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/chat-and-speak")
async def voice_chat_with_speech(
    file: UploadFile = File(..., description="Audio file of user's question"),
    session_id: str = Query(..., description="Session ID for chat"),
    mode: str = Query(default="normal", description="Chat mode: normal, teaching, guiding"),
    include_speech: bool = Query(default=True, description="Include audio response of LLM answer"),
    voice: str = Query(default="alloy", description="Voice tone for response: alloy, echo, fable, onyx, nova, shimmer")
):
    """
    **Complete Voice Chat Workflow**
    
    **Flow:**
    1. User speaks question → Upload audio
    2. Audio transcribed to text
    3. Text sent to LLM for response
    4. (Optional) Response converted to speech
    
    **Returns:** Transcribed question + LLM response + (Optional) Audio of response
    
    Perfect for voice-first chat interface!
    """
    temp_file_path = None
    
    try:
        if not settings.ENABLE_VOICE:
            raise HTTPException(status_code=503, detail="Voice features are disabled")
        
        # Validate session
        if not session_service.validate_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Step 1: Save and transcribe audio
        temp_file_path = f"temp_{uuid.uuid4()}.wav"
        with open(temp_file_path, "wb") as buffer:
            contents = await file.read()
            buffer.write(contents)
        
        transcribed_text = ai_service.transcribe_audio(temp_file_path)
        
        # Step 2: Get LLM response
        system_prompt = prompt_builder.build_system_prompt(mode=mode)
        context_messages = session_service.get_session_context(
            session_id,
            max_messages=settings.MAX_CONTEXT_MESSAGES
        )
        
        start_time = time.time()
        ai_response = ai_service.chat(
            system_prompt=system_prompt,
            messages=context_messages,
            user_message=transcribed_text
        )
        response_time = time.time() - start_time
        
        # Step 3: Store messages in session
        session_service.add_message_to_session(session_id, "user", transcribed_text)
        session_service.add_message_to_session(session_id, "assistant", ai_response)
        
        # Step 4: Log analytics
        query_id = str(uuid.uuid4())
        analytics_service.log_query(
            query_id=query_id,
            session_id=session_id,
            message=transcribed_text,
            mode=mode,
            response_time=response_time
        )
        
        # Step 5: Convert response to speech if requested
        response_data = {
            "status": "success",
            "transcribed_question": transcribed_text,
            "ai_response": ai_response,
            "mode": mode,
            "response_time": response_time,
            "has_audio": include_speech
        }
        
        if include_speech:
            # Validate voice option
            valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
            if voice not in valid_voices:
                voice = settings.DEFAULT_TTS_VOICE
            
            audio_bytes = ai_service.text_to_speech(ai_response, voice=voice)
            
            if audio_bytes:
                response_data["audio_voice"] = voice
                response_data["audio_size_bytes"] = len(audio_bytes)
        
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        return response_data
    
    except HTTPException:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise
    except Exception as e:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Voice chat failed: {str(e)}")


@router.post("/speak")
async def text_to_speech(
    text: str = Query(..., description="Text to convert to speech"),
    voice: str = Query(default="alloy", description="Voice to use: alloy, echo, fable, onyx, nova, shimmer")
):
    """
    **Step 2b: Convert Text to Speech**
    
    After LLM response → Convert response text to audio → User hears answer
    
    Available voices: alloy, echo, fable, onyx, nova, shimmer
    Returns: MP3 audio file
    """
    try:
        if not settings.ENABLE_VOICE:
            raise HTTPException(status_code=503, detail="Voice features are disabled")
        
        # Validate voice option
        valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        if voice not in valid_voices:
            voice = settings.DEFAULT_TTS_VOICE
        
        # Generate speech
        audio_bytes = ai_service.text_to_speech(text, voice=voice)
        
        if audio_bytes is None:
            raise HTTPException(status_code=500, detail="Failed to generate speech")
        
        # Return audio as MP3
        response = StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'attachment; filename="speech.mp3"',
                "X-Text": text[:100],
                "X-Voice": voice,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")






