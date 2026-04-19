"""Analytics Service for tracking usage and interactions - Chatbot Service."""

from datetime import datetime
from typing import Dict, List, Optional
import json


class AnalyticsService:
    """Service for tracking and analyzing user interactions and chatbot usage."""
    
    def __init__(self):
        """Initialize analytics service."""
        self.query_logs: List[Dict] = []
        self.user_stats: Dict = {}
        self.session_stats: Dict = {}
    
    def log_query(self, query_id: str, session_id: str, message: str, 
                  mode: str, response_time: float, user_id: Optional[str] = None) -> None:
        """
        Log a user query for analytics.
        
        Args:
            query_id: Unique query identifier
            session_id: Session identifier
            message: User message content
            mode: Chat mode (teaching, guiding, normal, quiz)
            response_time: AI response time in seconds
            user_id: Optional user identifier
        """
        log_entry = {
            "query_id": query_id,
            "session_id": session_id,
            "user_id": user_id,
            "message": message,
            "mode": mode,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.query_logs.append(log_entry)
        
        # Only update user stats if user_id is provided
        if user_id:
            if user_id not in self.user_stats:
                self.user_stats[user_id] = {
                    "total_queries": 0,
                    "mode_usage": {},
                    "total_response_time": 0.0,
                    "topics": []
                }
            
            self.user_stats[user_id]["total_queries"] += 1
            
            # Track mode usage
            if mode not in self.user_stats[user_id]["mode_usage"]:
                self.user_stats[user_id]["mode_usage"][mode] = 0
            self.user_stats[user_id]["mode_usage"][mode] += 1
            
            # Track response time
            self.user_stats[user_id]["total_response_time"] += response_time
    
    def get_user_analytics(self, user_id: str) -> Dict:
        """
        Get analytics for a specific user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dictionary with user analytics
        """
        if user_id not in self.user_stats:
            return {
                "user_id": user_id,
                "total_queries": 0,
                "mode_usage": {},
                "avg_response_time": 0.0,
                "topics_discussed": []
            }
        
        stats = self.user_stats[user_id]
        avg_response_time = (
            stats["total_response_time"] / stats["total_queries"]
            if stats["total_queries"] > 0 else 0.0
        )
        
        return {
            "user_id": user_id,
            "total_queries": stats["total_queries"],
            "mode_usage": stats["mode_usage"],
            "avg_response_time": round(avg_response_time, 2),
            "topics_discussed": stats["topics"]
        }
    
    def get_session_analytics(self, session_id: str) -> Dict:
        """
        Get analytics for a specific session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Dictionary with session analytics
        """
        session_queries = [
            log for log in self.query_logs
            if log["session_id"] == session_id
        ]
        
        if not session_queries:
            return {
                "session_id": session_id,
                "total_queries": 0,
                "mode_usage": {},
                "avg_response_time": 0.0
            }
        
        mode_usage = {}
        total_response_time = 0.0
        
        for query in session_queries:
            mode = query["mode"]
            if mode not in mode_usage:
                mode_usage[mode] = 0
            mode_usage[mode] += 1
            total_response_time += query["response_time"]
        
        avg_response_time = total_response_time / len(session_queries)
        
        return {
            "session_id": session_id,
            "total_queries": len(session_queries),
            "mode_usage": mode_usage,
            "avg_response_time": round(avg_response_time, 2)
        }
    
    def get_global_analytics(self) -> Dict:
        """
        Get global platform analytics.
        
        Returns:
            Dictionary with platform-wide analytics
        """
        if not self.query_logs:
            return {
                "total_queries": 0,
                "total_users": 0,
                "total_sessions": 0,
                "mode_usage": {},
                "avg_response_time": 0.0
            }
        
        mode_usage = {}
        total_response_time = 0.0
        sessions = set()
        
        for query in self.query_logs:
            mode = query["mode"]
            if mode not in mode_usage:
                mode_usage[mode] = 0
            mode_usage[mode] += 1
            total_response_time += query["response_time"]
            sessions.add(query["session_id"])
        
        avg_response_time = total_response_time / len(self.query_logs)
        
        return {
            "total_queries": len(self.query_logs),
            "total_users": len(self.user_stats),
            "total_sessions": len(sessions),
            "mode_usage": mode_usage,
            "avg_response_time": round(avg_response_time, 2)
        }
    
    def extract_topics(self, text: str) -> List[str]:
        """
        Extract topics/keywords from text.
        Basic implementation - can be enhanced with NLP libraries.
        
        Args:
            text: Text to extract topics from
            
        Returns:
            List of extracted topics
        """
        stop_words = {"the", "a", "an", "is", "are", "what", "how", "when", "where", "why"}
        words = text.lower().split()
        topics = [
            word for word in words
            if word not in stop_words and len(word) > 3
        ]
        return list(set(topics))  # Remove duplicates


# Global analytics service instance
analytics_service = AnalyticsService()
