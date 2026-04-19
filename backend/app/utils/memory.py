from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json


class SessionMemory:
    """In-memory session management for conversation history."""
    
    def __init__(self):
        self.sessions: Dict[str, Dict] = {}
    
    def create_session(self, session_id: str, user_id: Optional[str] = None) -> None:
        """Create a new session."""
        self.sessions[session_id] = {
            "user_id": user_id,
            "created_at": datetime.now(),
            "last_activity": datetime.now(),
            "messages": [],
            "message_count": 0
        }
    
    def add_message(self, session_id: str, role: str, content: str) -> None:
        """Add a message to session history."""
        if session_id not in self.sessions:
            return
        
        self.sessions[session_id]["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.sessions[session_id]["message_count"] += 1
        self.sessions[session_id]["last_activity"] = datetime.now()
    
    def get_context(self, session_id: str, max_messages: int = 5) -> List[Dict]:
        """Get last N messages for context injection."""
        if session_id not in self.sessions:
            return []
        
        messages = self.sessions[session_id]["messages"]
        # Return last max_messages or all if less
        return messages[-max_messages:] if len(messages) > max_messages else messages
    
    def get_all_messages(self, session_id: str) -> List[Dict]:
        """Get all messages in a session."""
        if session_id not in self.sessions:
            return []
        return self.sessions[session_id]["messages"]
    
    def get_session_info(self, session_id: str) -> Dict:
        """Get session information."""
        if session_id not in self.sessions:
            return {}
        
        session = self.sessions[session_id]
        return {
            "session_id": session_id,
            "created_at": session["created_at"],
            "last_activity": session["last_activity"],
            "message_count": session["message_count"]
        }
    
    def get_user_sessions(self, user_id: str) -> List[str]:
        """Get all sessions for a user."""
        return [
            session_id for session_id, data in self.sessions.items()
            if data["user_id"] == user_id
        ]
    
    def clear_expired_sessions(self, timeout_seconds: int = 3600) -> None:
        """Remove sessions that haven't been active within timeout period."""
        now = datetime.now()
        expired_sessions = []
        
        for session_id, data in self.sessions.items():
            if (now - data["last_activity"]).total_seconds() > timeout_seconds:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.sessions[session_id]


# Global session memory instance
session_memory = SessionMemory()
