"""AI Service with Ollama (Primary), Gemini & OpenAI (Fallback) support."""

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
    """Service for AI interactions with Ollama (primary), Gemini, and OpenAI (fallbacks)."""
    
    def __init__(self, db_session=None):
        self.use_ollama = False
        self.use_gemini = False
        self.gemini_model = None
        self.openai_client = None
        self.ollama_base_url = settings.OLLAMA_BASE_URL
        self.ollama_model = settings.OLLAMA_MODEL
        self.db_session = db_session
        
        # Initialize Ollama (Local - No API key needed!)
        if self._check_ollama_available():
            self.use_ollama = True
            print(f"[OK] Ollama API initialized with model: {self.ollama_model}")
            print(f"     Endpoint: {self.ollama_base_url}")
        else:
            print(f"[WARNING] Ollama not available at {self.ollama_base_url}")
            print("     Make sure Ollama is running: https://ollama.ai/")
            print("     You can download models with: ollama pull mistral")
        
        # Initialize Gemini as fallback if available
        if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)
                self.use_gemini = True
                print(f"[OK] Gemini API initialized (fallback)")
            except Exception as e:
                print(f"[WARNING] Gemini initialization failed: {e}")
                self.use_gemini = False
        
        # Initialize OpenAI as final fallback
        try:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            print(f"[OK] OpenAI API available (final fallback)")
        except Exception as e:
            self.openai_client = None
            print(f"[WARNING] OpenAI client initialization failed: {e}")
        
        self.temperature = settings.OPENAI_TEMPERATURE
        self.max_tokens = settings.OPENAI_MAX_TOKENS
    
    def _check_ollama_available(self) -> bool:
        """Check if Ollama service is running and accessible."""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except Exception as e:
            return False
    
    def chat(self, system_prompt: str, messages: list, user_message: str = None) -> str:
        """Send a chat request to Ollama (primary) or fallback providers."""
        
        # Try Ollama first (local, no API key needed)
        if self.use_ollama:
            try:
                # Build conversation with system prompt
                if user_message:
                    conversation_messages = prompt_builder.build_conversation_messages(
                        system_prompt, messages, user_message
                    )
                else:
                    conversation_messages = [{"role": "system", "content": system_prompt}] + messages
                
                # Use OpenAI-compatible API endpoint for Ollama
                response = requests.post(
                    f"{self.ollama_base_url}/v1/chat/completions",
                    json={
                        "model": self.ollama_model,
                        "messages": conversation_messages,
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens,
                        "stream": False
                    },
                    timeout=120
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"Ollama returned status {response.status_code}")
            
            except Exception as e:
                print(f"Ollama error: {e}, trying Gemini fallback...")
        
        # Try Gemini next
        if self.use_gemini:
            try:
                if user_message:
                    conversation_messages = prompt_builder.build_conversation_messages(
                        system_prompt, messages, user_message
                    )
                else:
                    conversation_messages = [{"role": "system", "content": system_prompt}] + messages
                
                user_msg_content = conversation_messages[-1]["content"] if conversation_messages else ""
                
                if system_prompt and user_msg_content:
                    user_msg_content = f"{system_prompt}\n\nUser: {user_msg_content}"
                
                response = self.gemini_model.generate_content(
                    user_msg_content,
                    generation_config=genai.types.GenerationConfig(
                        temperature=self.temperature,
                        max_output_tokens=self.max_tokens,
                    )
                )
                
                return response.text
            
            except Exception as e:
                print(f"Gemini error: {e}, trying OpenAI fallback...")
        
        # Try OpenAI as final fallback
        if self.openai_client:
            try:
                if user_message:
                    conversation_messages = prompt_builder.build_conversation_messages(
                        system_prompt, messages, user_message
                    )
                else:
                    conversation_messages = [{"role": "system", "content": system_prompt}] + messages
                
                response = self.openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=conversation_messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens
                )
                
                return response.choices[0].message.content
            
            except Exception as e:
                return f"Error: {str(e)}"
        
        return "Error: No AI service available (Ollama, Gemini, and OpenAI all unavailable)"
    
    async def chat_stream(self, system_prompt: str, messages: list, user_message: str = None):
        """Stream chat response from Ollama or fallback providers."""
        
        # Try Ollama first (local streaming)
        if self.use_ollama:
            try:
                if user_message:
                    conversation_messages = prompt_builder.build_conversation_messages(
                        system_prompt, messages, user_message
                    )
                else:
                    conversation_messages = [{"role": "system", "content": system_prompt}] + messages
                
                response = requests.post(
                    f"{self.ollama_base_url}/v1/chat/completions",
                    json={
                        "model": self.ollama_model,
                        "messages": conversation_messages,
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens,
                        "stream": True
                    },
                    timeout=120,
                    stream=True
                )
                
                if response.status_code == 200:
                    for line in response.iter_lines():
                        if line:
                            try:
                                data = json.loads(line.decode('utf-8').replace('data: ', ''))
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    if "content" in delta:
                                        yield delta["content"]
                            except:
                                pass
                    return
                else:
                    raise Exception(f"Ollama streaming returned status {response.status_code}")
            
            except Exception as e:
                print(f"Ollama streaming error: {e}")
        
        # Try Gemini streaming if available
        if self.use_gemini:
            try:
                if user_message:
                    conversation_messages = prompt_builder.build_conversation_messages(
                        system_prompt, messages, user_message
                    )
                else:
                    conversation_messages = [{"role": "system", "content": system_prompt}] + messages
                
                user_msg_content = conversation_messages[-1]["content"] if conversation_messages else ""
                if system_prompt and user_msg_content:
                    user_msg_content = f"{system_prompt}\n\nUser: {user_msg_content}"
                
                response = self.gemini_model.generate_content(
                    user_msg_content,
                    stream=True,
                    generation_config=genai.types.GenerationConfig(
                        temperature=self.temperature,
                        max_output_tokens=self.max_tokens,
                    )
                )
                
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                print(f"Gemini streaming error: {e}")
        
        # Fallback to OpenAI streaming
        if self.openai_client:
            try:
                if user_message:
                    conversation_messages = prompt_builder.build_conversation_messages(
                        system_prompt, messages, user_message
                    )
                else:
                    conversation_messages = [{"role": "system", "content": system_prompt}] + messages
                
                stream = self.openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=conversation_messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    stream=True
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            
            except Exception as e:
                yield f"Error: {str(e)}"
    
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
        """Validate that at least one AI service is available."""
        if self.use_ollama:
            return True  # Ollama doesn't need validation
        
        if self.use_gemini:
            try:
                test_response = self.gemini_model.generate_content("test")
                return bool(test_response.text)
            except Exception as e:
                print(f"Gemini validation failed: {e}")
        
        if self.openai_client:
            try:
                self.openai_client.models.list()
                return True
            except Exception as e:
                print(f"OpenAI validation failed: {e}")
        
        return False
    
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
