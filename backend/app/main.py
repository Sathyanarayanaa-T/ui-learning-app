"""FastAPI main application with AI Tutor and Chatbot features."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

from .core.config import settings
from .core.database import create_all_tables
from .routes import (
    chat, session, analytics, voice, documents, progress, proactive, learning_path
)
from .services.core import ai_service

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-ready AI Tutor & Chatbot backend for learning platforms"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(session.router)
app.include_router(analytics.router)
app.include_router(voice.router)
app.include_router(documents.router)
app.include_router(progress.router)
app.include_router(proactive.router)
app.include_router(learning_path.router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "endpoints": {
            "chat": {
                "POST /ai/chat": "Chat with AI (non-streaming)",
                "POST /ai/chat/stream": "Chat with AI (streaming)",
                "GET /ai/chat/history/{session_id}": "Get chat history"
            },
            "session": {
                "POST /session/create": "Create new session",
                "GET /session/{session_id}": "Get session info",
                "GET /session/user/{user_id}": "Get user sessions"
            },
            "analytics": {
                "GET /analytics/user/{user_id}": "User analytics",
                "GET /analytics/session/{session_id}": "Session analytics",
                "GET /analytics/global": "Global analytics"
            },
            "voice": {
                "POST /voice/transcribe": "Transcribe audio (coming soon)",
                "POST /voice/speak": "Text-to-speech (coming soon)",
                "POST /voice/chat": "Voice chat (coming soon)"
            }
        }
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Generic exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    try:
        create_all_tables()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Validate OpenAI API key
    if not ai_service.validate_api_key():
        logger.error("Invalid OpenAI API key")
    else:
        logger.info("OpenAI API key validated")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown."""
    logger.info(f"Shutting down {settings.APP_NAME}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENV == "development"
    )
