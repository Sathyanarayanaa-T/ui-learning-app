#!/usr/bin/env python3
"""Test the real chat endpoint with NVIDIA NIM."""

import requests
import json
import uuid

BASE_URL = "http://localhost:8000"
SESSION_ID = str(uuid.uuid4())

print("=" * 60)
print("TESTING REAL CHAT ENDPOINT WITH NVIDIA NIM")
print("=" * 60)

# Test 1: Check health
print("\n1️⃣ Checking API health...")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Create a session
print(f"\n2️⃣ Creating session...")
try:
    response = requests.post(
        f"{BASE_URL}/sessions/create",
        json={"user_id": "test-user", "subject": "math"},
        timeout=5
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        session_data = response.json()
        print(f"   Session ID: {session_data.get('session_id', SESSION_ID)}")
        SESSION_ID = session_data.get('session_id', SESSION_ID)
    else:
        print(f"   Response: {response.json()}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Send chat message
print(f"\n3️⃣ Sending chat message to NVIDIA NIM...")
chat_payload = {
    "session_id": SESSION_ID,
    "user_message": "What is 2+2?",
    "mode": "normal"
}

print(f"   Payload: {json.dumps(chat_payload, indent=2)}")

try:
    print(f"   Sending to {BASE_URL}/ai/chat...")
    response = requests.post(
        f"{BASE_URL}/ai/chat",
        json=chat_payload,
        timeout=120  # 2 minute timeout for NVIDIA NIM response
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        chat_response = response.json()
        print(f"\n✅ SUCCESS! Chat response received:")
        print(f"\n   AI Response: {chat_response.get('response', 'N/A')}")
        print(f"\n   Full response:")
        print(json.dumps(chat_response, indent=2))
    else:
        print(f"   ❌ Error response:")
        print(json.dumps(response.json(), indent=2))
        
except requests.exceptions.Timeout:
    print(f"   ⏱️  TIMEOUT: NVIDIA NIM is taking longer than expected")
    print(f"   This could mean:")
    print(f"   - NVIDIA cloud is processing (normal for thinking-enabled models)")
    print(f"   - Network latency is high")
    print(f"   - Try again or check NVIDIA API status")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
