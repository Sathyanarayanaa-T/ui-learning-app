#!/usr/bin/env python3
"""Quick test script for NVIDIA NIM integration."""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.services.core.ai_service import AIService

def test_nvidia_nim():
    """Test NVIDIA NIM connection and basic chat."""
    print("=" * 60)
    print("TESTING NVIDIA NIM INTEGRATION")
    print("=" * 60)
    
    # Print configuration
    print(f"\n📋 Configuration:")
    print(f"   API Key: {settings.NVIDIA_NIM_API_KEY[:20]}...{'(CONFIGURED)' if settings.NVIDIA_NIM_API_KEY else '(NOT SET)'}")
    print(f"   Base URL: {settings.NVIDIA_NIM_BASE_URL}")
    print(f"   Model: {settings.NVIDIA_NIM_MODEL}")
    print(f"   Thinking Enabled: {settings.NVIDIA_NIM_ENABLE_THINKING}")
    
    # Initialize AI Service
    print(f"\n🔧 Initializing AI Service...")
    try:
        ai_service = AIService()
        print(f"   ✓ AI Service initialized")
    except Exception as e:
        print(f"   ✗ Failed to initialize AI Service: {e}")
        return
    
    # Check service availability
    print(f"\n🔍 Service Availability:")
    print(f"   NVIDIA NIM Available: {ai_service.use_nvidia_nim}")
    print(f"   Ollama Available: {ai_service.use_ollama}")
    print(f"   Gemini Available: {ai_service.use_gemini}")
    print(f"   OpenAI Available: {ai_service.openai_client is not None}")
    
    if not ai_service.use_nvidia_nim:
        print(f"\n⚠️  WARNING: NVIDIA NIM not available! Check your API key.")
        return
    
    # Test basic chat
    print(f"\n💬 Testing basic chat...")
    try:
        system_prompt = "You are a helpful AI assistant."
        messages = []
        user_message = "What is 2+2?"
        
        response = ai_service.chat(system_prompt, messages, user_message)
        print(f"   ✓ Response received:")
        print(f"   {response[:200]}..." if len(response) > 200 else f"   {response}")
    except Exception as e:
        print(f"   ✗ Chat failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print(f"\n✅ NVIDIA NIM is working correctly!")
    print("=" * 60)

if __name__ == "__main__":
    test_nvidia_nim()
