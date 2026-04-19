"""Session Service for managing user chat sessions - Chatbot Service."""

import uuid
from datetime import datetime
from ...utils.memory import session_memory
from typing import Dict, List, Optional


class SessionService:
    """Service for managing user chat sessions."""
    
    def create_session(self, user_id: Optional[str] = None) -> str:
        """
        Create a new chat session for a user.
        
        Args:
            user_id: Optional user identifier for session-based authentication
            
        Returns:
            Generated session ID
        """
        session_id = str(uuid.uuid4())
        session_memory.create_session(session_id, user_id)
        return session_id
    
    def get_session_info(self, session_id: str) -> Optional[Dict]:
        """
        Get information about a specific session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session information dictionary
        """
        return session_memory.get_session_info(session_id)
    
    def add_message_to_session(self, session_id: str, role: str, content: str) -> None:
        """
        Add a message to session history.
        
        Args:
            session_id: Session identifier
            role: Message role ('user' or 'assistant')
            content: Message content
        """
        session_memory.add_message(session_id, role, content)
    
    def get_session_context(self, session_id: str, max_messages: int = 5) -> List[Dict]:
        """
        Get conversation context (last N messages) for a session.
        Used for maintaining conversational continuity.
        
        Args:
            session_id: Session identifier
            max_messages: Maximum number of recent messages to retrieve
            
        Returns:
            List of recent messages
        """
        return session_memory.get_context(session_id, max_messages)
    
    def get_session_history(self, session_id: str) -> List[Dict]:
        """
        Get complete message history for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            List of all messages in the session
        """
        return session_memory.get_all_messages(session_id)
    
    def get_user_sessions(self, user_id: str) -> List[str]:
        """
        Get all session IDs for a specific user.
        
        Args:
            user_id: User identifier
            
        Returns:
            List of session IDs
        """
        return session_memory.get_user_sessions(user_id)
    
    def validate_session(self, session_id: str) -> bool:
        """
        Check if a session exists and is valid.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session is valid, False otherwise
        """
        return session_id in session_memory.sessions
    
    def get_session_message_count(self, session_id: str) -> int:
        """
        Get total message count in a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Number of messages in session
        """
        if session_id not in session_memory.sessions:
            return 0
        return session_memory.sessions[session_id]["message_count"]
    
    def cleanup_expired_sessions(self, timeout_seconds: int = 3600) -> None:
        """
        Remove expired sessions (maintenance task).
        
        Args:
            timeout_seconds: Session timeout in seconds (default: 1 hour)
        """
        session_memory.clear_expired_sessions(timeout_seconds)
    
    def end_session(self, session_id: str) -> bool:
        """
        Explicitly end a chat session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session was ended, False if not found
        """
        if self.validate_session(session_id):
            session_memory.end_session(session_id)
            return True
        return False


# Global session service instance
session_service = SessionService()
