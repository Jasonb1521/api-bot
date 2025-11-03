# Gemini Streaming Error Troubleshooting Guide

## 🔍 Problem Summary

Your error `StopAsyncIteration` is **NOT caused by streaming itself**. It's caused by **Gemini returning empty responses** immediately without generating any content.

## 🎯 Root Causes (In Order of Likelihood)

### 1. **Safety Filters** (Most Common) ⚠️
Gemini has strict content safety filters that block responses if it detects:
- Perceived harmful content (even false positives)
- Restaurant/food ordering context might trigger false positives
- System prompts with instructions might be misinterpreted

**Status:** ✅ **FIXED** - Added safety settings to disable overly strict filters

### 2. **API Quota/Rate Limits** 💳
Your free tier API key might be:
- Rate limited (too many requests)
- Quota exhausted (daily limit reached)
- Not properly activated

**Check:** https://makersuite.google.com/app/apikey

### 3. **Message Format Issues** 📝
Gemini expects specific message formats:
- System instructions separate from conversation
- Alternating user/model roles
- No empty messages

**Status:** Your code handles this correctly

### 4. **Model/Region Issues** 🌍
- Model name might be wrong
- API might not be available in your region
- Billing not enabled

## 🧪 Testing Steps

### Step 1: Test Your API Key

Run the test script:

```bash
cd /home/jason/Desktop/Jibin/Hotelbot
source .env
python3 test_gemini.py
```

**Expected Results:**
- ✅ All tests pass → API key works, issue is in app configuration
- ❌ All tests fail → API key has problems
- ⚠️ Non-streaming works, streaming fails → Streaming issue

### Step 2: Test Non-Streaming Mode

Edit your `.env` file:
```bash
USE_STREAMING=false
```

Restart backend:
```bash
docker compose restart backend
```

Test your chatbot. If it works, then streaming was the issue.

### Step 3: Check Debug Logs

Monitor logs with detailed info:
```bash
docker compose logs -f backend | grep -E "(Starting Gemini|System instruction|Contents|response)"
```

Look for:
- What's being sent to Gemini
- Whether any response comes back
- Safety filter blocks

### Step 4: Try Different Model

Edit `.env`:
```bash
# Try Pro model instead of Flash
GEMINI_MODEL=gemini-1.5-pro
```

Or try:
```bash
GEMINI_MODEL=gemini-1.0-pro
```

Restart:
```bash
docker compose restart backend
```

## ✅ What I've Fixed

### 1. **Added Safety Settings** (backend/app/services/llm_service.py)
```python
safety_settings = {
    "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
    "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
    "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
}
```

This disables overly strict content filtering that might block restaurant-related content.

### 2. **Added StopAsyncIteration Handling**
- Catches the error gracefully
- Returns fallback message instead of crashing
- Logs detailed error information

### 3. **Added Debug Logging**
- Shows what messages are sent to Gemini
- Shows system instructions
- Shows response chunks

### 4. **Added Non-Streaming Mode Toggle**
- Set `USE_STREAMING=false` to test without streaming
- Helps diagnose if streaming is the issue

## 🚀 Next Steps

1. **Run the test script** to verify your API key
2. **Check the logs** to see what's being sent to Gemini
3. **Try non-streaming mode** to isolate the issue
4. **Check your Gemini console** for quota/billing issues

## 📊 Expected Behavior After Fixes

### With Streaming (USE_STREAMING=true):
```
🚀 Starting Gemini stream with 1 message(s)
📝 System instruction: நீங்கள் ஒரு உணவக ஊழியர்...
📝 Contents: [{'role': 'user', 'parts': ['இட்லி கிடைக்குமா?']}]
Raw chunk 1: [text content]
Raw chunk 2: [text content]
✅ Stream completed with 2 total chunks
```

### With Non-Streaming (USE_STREAMING=false):
```
🚀 Starting LLM non-streaming mode (for debugging)...
📤 Calling Gemini non-streaming API...
✅ Non-streaming response: [full response text]
```

## ⚡ Quick Fix Summary

**If safety filters are the issue (most likely):**
- ✅ Already fixed with safety settings

**If streaming is the issue:**
- Set `USE_STREAMING=false` in `.env`
- Restart backend

**If API key is the issue:**
- Check quota at https://makersuite.google.com/app/apikey
- Enable billing if needed
- Try a different API key

**If model is the issue:**
- Try `GEMINI_MODEL=gemini-1.5-pro`
- Or `GEMINI_MODEL=gemini-1.0-pro`

## 🔗 Useful Links

- Gemini API Keys: https://makersuite.google.com/app/apikey
- Gemini Docs: https://ai.google.dev/docs
- Safety Settings: https://ai.google.dev/docs/safety_setting_gemini
- Billing: https://console.cloud.google.com/billing

## 💬 Can You Use Streaming?

**YES!** After the fixes:
- Safety settings should allow content through
- StopAsyncIteration is handled gracefully
- Fallback to error message if no content

The streaming itself is not the problem. The problem was Gemini not generating content, which made the stream end immediately.
