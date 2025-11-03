#!/usr/bin/env python3
"""Test script to verify Gemini API key and configuration."""

import os
import google.generativeai as genai
import asyncio

async def test_gemini():
    """Test Gemini API with simple request."""

    # Get API key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not set in environment")
        return

    print(f"✅ API Key found: {api_key[:10]}...{api_key[-4:]}")

    # Configure Gemini
    genai.configure(api_key=api_key)

    # Test with gemini-1.5-flash (default)
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    print(f"🧪 Testing model: {model_name}")

    # Create model
    model = genai.GenerativeModel(
        model_name=model_name,
        generation_config={
            "temperature": 0.7,
            "max_output_tokens": 200,
        }
    )

    # Test 1: Simple English prompt (non-streaming)
    print("\n" + "="*60)
    print("Test 1: Simple English prompt (non-streaming)")
    print("="*60)
    try:
        response = await model.generate_content_async("Say hello in one sentence.")
        if response.text:
            print(f"✅ Response: {response.text}")
        else:
            print("❌ No text in response")
            print(f"Response object: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: Simple Tamil prompt (non-streaming)
    print("\n" + "="*60)
    print("Test 2: Simple Tamil prompt (non-streaming)")
    print("="*60)
    try:
        response = await model.generate_content_async("வணக்கம் என்று சொல்லுங்கள்.")
        if response.text:
            print(f"✅ Response: {response.text}")
        else:
            print("❌ No text in response")
            print(f"Response object: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 3: Menu-style prompt (non-streaming)
    print("\n" + "="*60)
    print("Test 3: Restaurant menu prompt (non-streaming)")
    print("="*60)
    try:
        response = await model.generate_content_async(
            "நீங்கள் ஒரு உணவக ஊழியர். 'இட்லி கிடைக்குமா?' என்று ஒரு வாடிக்கையாளர் கேட்கிறார். பதிலளிக்கவும்."
        )
        if response.text:
            print(f"✅ Response: {response.text}")
        else:
            print("❌ No text in response")
            print(f"Response object: {response}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 4: Simple streaming
    print("\n" + "="*60)
    print("Test 4: Simple streaming test")
    print("="*60)
    try:
        response = await model.generate_content_async(
            "Count from 1 to 5.",
            stream=True
        )
        chunks_received = 0
        text_accumulated = ""
        async for chunk in response:
            chunks_received += 1
            if hasattr(chunk, 'text') and chunk.text:
                text_accumulated += chunk.text
                print(f"Chunk {chunks_received}: {chunk.text}")

        if chunks_received > 0:
            print(f"✅ Streaming works! Received {chunks_received} chunks")
            print(f"Full text: {text_accumulated}")
        else:
            print("❌ No chunks received from streaming")
    except Exception as e:
        print(f"❌ Streaming error: {e}")

    # Test 5: Check quota/limits
    print("\n" + "="*60)
    print("Test 5: Checking API limits")
    print("="*60)
    print("💡 Check your quota at: https://makersuite.google.com/app/apikey")
    print("💡 Check your billing at: https://console.cloud.google.com/billing")

if __name__ == "__main__":
    asyncio.run(test_gemini())
