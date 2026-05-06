"""AI Service with NVIDIA NIM (Primary), Ollama, Gemini & OpenAI (Fallbacks) support."""

from openai import OpenAI, AsyncOpenAI
from ...core.config import settings
from .prompt_builder import prompt_builder
from ...models.db_models import Chat, ChatFeedback
import json
import requests

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class AIService:
    """Service for AI interactions with NVIDIA NIM Kimi-K2 (EXCLUSIVE - No fallbacks)."""
    
    def __init__(self, db_session=None):
        self.use_nvidia_nim = False
        
        # NVIDIA NIM Configuration (EXCLUSIVE)
        self.nvidia_nim_api_key = settings.NVIDIA_NIM_API_KEY
        self.nvidia_nim_base_url = settings.NVIDIA_NIM_BASE_URL
        self.nvidia_nim_model = settings.NVIDIA_NIM_MODEL
        self.nvidia_nim_enable_thinking = settings.NVIDIA_NIM_ENABLE_THINKING
        self.db_session = db_session
        
        # Initialize NVIDIA NIM (EXCLUSIVE - Only provider)
        if self._check_nvidia_nim_available():
            self.use_nvidia_nim = True
            print(f"[OK] NVIDIA NIM API initialized with model: {self.nvidia_nim_model}")
            print(f"     Endpoint: {self.nvidia_nim_base_url}")
            print(f"     Extended Thinking: {self.nvidia_nim_enable_thinking}")
            print(f"[INFO] EXCLUSIVE MODE: Only NVIDIA NIM Kimi-K2 is used (no fallbacks)")
        else:
            print(f"[ERROR] NVIDIA NIM not available. Cannot proceed.")
            print(f"[ERROR] API Key may not be set or is invalid.")
            print(f"[ERROR] Set NVIDIA_NIM_API_KEY environment variable with your valid API key")
            raise Exception("NVIDIA NIM API is required and not available. Please check your API key.")
    
    def _check_nvidia_nim_available(self) -> bool:
        """Check if NVIDIA NIM API key is configured."""
        if not self.nvidia_nim_api_key:
            return False
        try:
            # Simple check by testing headers
            headers = {
                "Authorization": f"Bearer {self.nvidia_nim_api_key}",
                "Accept": "application/json"
            }
            response = requests.get(
                f"{self.nvidia_nim_base_url}/models",
                headers=headers,
                timeout=5
            )
            return response.status_code in [200, 401]  # 401 means key is invalid, but API exists
        except Exception as e:
            return False
    
    def _check_ollama_available(self) -> bool:
        """Check if Ollama service is running and accessible."""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except Exception as e:
            return False
    
    def chat(self, system_prompt: str, messages: list, user_message: str = None) -> str:
        """Send a chat request to NVIDIA NIM Kimi-K2 (EXCLUSIVE)."""
        
        if not self.use_nvidia_nim:
            raise Exception("NVIDIA NIM Kimi-K2 is not available. Please check your API key configuration.")
        
        try:
            # Build conversation with system prompt
            if user_message:
                conversation_messages = prompt_builder.build_conversation_messages(
                    system_prompt, messages, user_message
                )
            else:
                conversation_messages = [{"role": "system", "content": system_prompt}] + messages
            
            headers = {
                "Authorization": f"Bearer {self.nvidia_nim_api_key}",
                "Accept": "application/json"
            }
            
            payload = {
                "model": self.nvidia_nim_model,
                "messages": conversation_messages,
                "max_tokens": settings.OPENAI_MAX_TOKENS,
                "temperature": settings.OPENAI_TEMPERATURE,
                "top_p": 1.0,
                "stream": False
            }
            
            # Add thinking capability if enabled
            if self.nvidia_nim_enable_thinking:
                payload["chat_template_kwargs"] = {"thinking": True}
            
            response = requests.post(
                f"{self.nvidia_nim_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                error_detail = response.text
                raise Exception(f"NVIDIA NIM returned status {response.status_code}: {error_detail}")
        
        except Exception as e:
            error_msg = f"NVIDIA NIM Kimi-K2 Error: {str(e)}"
            print(error_msg)
            raise Exception(error_msg)
    
    async def chat_stream(self, system_prompt: str, messages: list, user_message: str = None):
        """Stream chat response from NVIDIA NIM Kimi-K2 (EXCLUSIVE)."""
        
        if not self.use_nvidia_nim:
            raise Exception("NVIDIA NIM Kimi-K2 is not available. Please check your API key configuration.")
        
        try:
            if user_message:
                conversation_messages = prompt_builder.build_conversation_messages(
                    system_prompt, messages, user_message
                )
            else:
                conversation_messages = [{"role": "system", "content": system_prompt}] + messages
            
            headers = {
                "Authorization": f"Bearer {self.nvidia_nim_api_key}",
                "Accept": "text/event-stream"
            }
            
            payload = {
                "model": self.nvidia_nim_model,
                "messages": conversation_messages,
                "max_tokens": settings.OPENAI_MAX_TOKENS,
                "temperature": settings.OPENAI_TEMPERATURE,
                "top_p": 1.0,
                "stream": True
            }
            
            # Add thinking capability if enabled
            if self.nvidia_nim_enable_thinking:
                payload["chat_template_kwargs"] = {"thinking": True}
            
            response = requests.post(
                f"{self.nvidia_nim_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=120,
                stream=True
            )
            
            if response.status_code == 200:
                for line in response.iter_lines():
                    if line:
                        try:
                            line_str = line.decode('utf-8') if isinstance(line, bytes) else line
                            if line_str.startswith('data: '):
                                data_str = line_str[6:]  # Remove 'data: ' prefix
                                if data_str == '[DONE]':
                                    break
                                data = json.loads(data_str)
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    if "content" in delta:
                                        yield delta["content"]
                        except Exception as e:
                            print(f"Error parsing NVIDIA NIM stream: {e}")
                            pass
                return
            else:
                raise Exception(f"NVIDIA NIM streaming returned status {response.status_code}: {response.text}")
        
        except Exception as e:
            error_msg = f"NVIDIA NIM Kimi-K2 Streaming Error: {str(e)}"
            print(error_msg)
            yield error_msg
    
    def get_embedding(self, text: str) -> list:
        """Get embeddings for text (for RAG use cases)."""
        try:
            if self.openai_client:
                response = self.openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text
                )
                return response.data[0].embedding
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return None
    
    def validate_api_key(self) -> bool:
        """Validate that NVIDIA NIM is available (EXCLUSIVE requirement)."""
        return self.use_nvidia_nim
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribe audio file to text using OpenAI Whisper."""
        try:
            if self.openai_client:
                with open(audio_file_path, "rb") as audio_file:
                    transcript = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
                return transcript.text
        except Exception as e:
            print(f"Transcription error: {e}")
            return f"Error transcribing audio: {str(e)}"
    
    def text_to_speech(self, text: str, voice: str = "alloy") -> bytes:
        """Convert text to speech using OpenAI TTS."""
        try:
            if self.openai_client:
                response = self.openai_client.audio.speech.create(
                    model="tts-1",
                    voice=voice,
                    input=text
                )
                return response.content
        except Exception as e:
            print(f"TTS error: {e}")
            return None
    
    def get_feedback_context(self, session_id: str, db_session) -> str:
        """Get feedback context for a session to adapt the system prompt."""
        try:
            # Query chats and their feedback for this session
            chats_with_feedback = db_session.query(Chat, ChatFeedback).outerjoin(
                ChatFeedback, Chat.chat_id == ChatFeedback.chat_id
            ).filter(Chat.session_id == session_id).all()
            
            if not chats_with_feedback:
                return ""
            
            liked_topics = []
            disliked_topics = []
            
            for chat, feedback in chats_with_feedback:
                if feedback:
                    # Extract topics from the user message
                    user_msg = chat.user_message[:50]  # First 50 chars
                    
                    if feedback.is_liked is True:
                        liked_topics.append(user_msg)
                    elif feedback.is_liked is False:
                        disliked_topics.append(user_msg)
            
            # Build feedback context
            feedback_context = ""
            if liked_topics:
                feedback_context += f"\n📌 Student LIKED explanations about: {', '.join(liked_topics)}\n   → Continue with this style: clear, concise, practical examples"
            
            if disliked_topics:
                feedback_context += f"\n📌 Student DISLIKED explanations about: {', '.join(disliked_topics)}\n   → Improve by: adding more details, examples, or different approach"
            
            return feedback_context
        
        except Exception as e:
            print(f"Error getting feedback context: {e}")
            return ""


# Global AI service instance
ai_service = AIService()
