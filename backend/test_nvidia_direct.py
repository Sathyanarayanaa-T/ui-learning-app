#!/usr/bin/env python3
"""Direct test of NVIDIA NIM API."""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("NVIDIA_NIM_API_KEY")
base_url = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
model = os.getenv("NVIDIA_NIM_MODEL", "openai/gpt-oss-20b")

print("=" * 60)
print("DIRECT NVIDIA NIM API TEST")
print("=" * 60)
print(f"\nConfiguration:")
print(f"  API Key: {api_key[:20]}..." if api_key else "  API Key: NOT SET")
print(f"  Base URL: {base_url}")
print(f"  Model: {model}")

if not api_key:
    print("\n❌ ERROR: NVIDIA_NIM_API_KEY not set in .env file!")
    exit(1)

# Test the API directly
print(f"\n🔍 Testing NVIDIA NIM API endpoint...")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

payload = {
    "model": model,
    "messages": [
        {"role": "user", "content": "Say 'NVIDIA NIM is working!'"}
    ],
    "max_tokens": 100,
    "temperature": 0.7,
    "top_p": 1.0,
    "stream": False
}

print(f"\nRequest URL: {base_url}/chat/completions")
print(f"Headers: Authorization: Bearer {api_key[:20]}...")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    print(f"\n📡 Sending request...")
    response = requests.post(
        f"{base_url}/chat/completions",
        headers=headers,
        json=payload,
        timeout=60
    )
    
    print(f"\n✓ Response received (Status: {response.status_code})")
    print(f"\nResponse Headers: {dict(response.headers)}")
    print(f"\nResponse Body:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        content = response.json()["choices"][0]["message"]["content"]
        print(f"\n✅ SUCCESS! Model response:")
        print(f"   {content}")
    else:
        print(f"\n❌ ERROR: Status code {response.status_code}")
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
