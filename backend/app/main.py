"""Main FastAPI application for HotelOrderBot audio service."""

import asyncio
import logging
import numpy as np
import os
import torch
import json
import wave
import io
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from collections import deque
from typing import Dict
from datetime import datetime
from qdrant_client import QdrantClient
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

# Import application modules
from app.services.vector_store_service import VectorStoreService
from app.services.llm_service import LLMService
from app.services.tts_service import TTSService
from app.services.asr_service import ASRService
from app.services.database_service import db_service
from app.config.prompts import get_prompt_with_menu
from app.tools.order_tools import TOOLS, OrderToolExecutor

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logging.getLogger('app.services.tts_service').setLevel(logging.DEBUG)

app = FastAPI(title="HotelOrderBot Audio Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services (shared across all clients)
vad_model = None
qdrant_client = None
embedding_model = None
vector_store_service = None
llm_service = None
tts_service = None
asr_service = None

# VAD settings
SAMPLE_RATE = 16000
CHUNK_SIZE = 512
VAD_THRESHOLD = 0.5
MIN_SILENCE_MS = 500
PRE_ROLL_MS = 300
POST_ROLL_MS = 500

# Active connections
connections: Dict[str, dict] = {}


def init_vad():
    """Initialize Silero VAD model."""
    global vad_model
    if vad_model is None:
        logger.info("Loading Silero VAD model...")
        vad_model, _ = torch.hub.load(
            repo_or_dir='snakers4/silero-vad',
            model='silero_vad',
            force_reload=False,
            onnx=True
        )
        logger.info("VAD model loaded successfully")
    return vad_model


async def init_vector_store():
    """Initialize Qdrant vector store and embedding model."""
    global qdrant_client, embedding_model, vector_store_service
    if vector_store_service is None:
        try:
            logger.info("Connecting to Qdrant...")
            qdrant_client = QdrantClient(host="hotelorderbot-qdrant", port=6333)
            logger.info("Qdrant connected successfully")

            logger.info("Loading multilingual embedding model 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'...")
            if SentenceTransformer is None:
                raise RuntimeError("sentence_transformers is not installed or failed to import")

            # Using paraphrase-multilingual-MiniLM-L12-v2 - supports 50+ languages including Tamil
            # No gated access required
            embedding_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
            logger.info("Embedding model loaded successfully")

            vector_store_service = VectorStoreService(qdrant_client, embedding_model)
            await vector_store_service.initialize_collection()

        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
    return vector_store_service


def init_llm():
    """Initialize LLM service."""
    global llm_service
    if llm_service is None:
        try:
            logger.info("Initializing Groq LLM service...")
            llm_service = LLMService()
            logger.info("LLM service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            import traceback
            traceback.print_exc()
    return llm_service


def init_tts():
    """Initialize TTS service."""
    global tts_service
    if tts_service is None:
        try:
            logger.info("Initializing Sarvam TTS service...")
            tts_service = TTSService()
            logger.info("TTS service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize TTS service: {e}")
    return tts_service


def init_asr():
    """Initialize ASR service."""
    global asr_service
    if asr_service is None:
        try:
            logger.info("Initializing Sarvam ASR service...")
            asr_service = ASRService()
            logger.info("ASR service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ASR service: {e}")
    return asr_service


def filter_price_mentions(user_query: str, bot_response: str) -> str:
    """
    Filter out price mentions from bot response if user didn't ask for price.

    Args:
        user_query: The user's input text
        bot_response: The bot's generated response

    Returns:
        Filtered bot response with price mentions removed if user didn't ask for price
    """
    # Keywords that indicate user is asking for price
    price_keywords = [
        'எவ்வளவு',  # how much
        'விலை',      # price
        'ரேட்',      # rate
        'price',
        'cost',
        'amount',
        'கான்',      # for (as in price for)
    ]

    # Check if user asked for price
    user_asked_price = any(keyword in user_query.lower() for keyword in price_keywords)

    if user_asked_price:
        # User asked for price, return response unchanged
        logger.info("✓ User asked for price - allowing price mention")
        return bot_response

    # User did NOT ask for price - remove price mentions
    logger.info("✓ User did NOT ask for price - filtering price mentions")

    # Split response into sentences (Tamil uses . as sentence delimiter)
    sentences = bot_response.split('.')
    filtered_sentences = []

    # Price indicators in response
    price_indicators = [
        'ரூபாய்',     # rupees
        'ரூபா',       # rupees (short)
        'rupees',
        'rupee',
        'rs',
        'தொகை',       # amount
    ]

    for sentence in sentences:
        # Check if sentence contains price information
        has_price = any(indicator in sentence.lower() for indicator in price_indicators)

        # Also check for number patterns that might indicate price
        # (e.g., "ஹண்ட்ரட்", "த்ரீ ஹண்ட்ரட்", etc.)
        number_words = [
            'ஹண்ட்ரட்', 'த்ரீ', 'ஃபோர்', 'ஃபைவ்', 'சிக்ஸ்',
            'செவன்', 'எய்ட்', 'நைன்', 'டென்', 'ட்வென்ட்டி',
            'திர்ட்டி', 'ஃபார்ட்டி', 'ஃபிஃப்டி', 'சிக்ஸ்டி',
            'செவன்ட்டி', 'எய்ட்டி', 'நைன்ட்டி'
        ]
        has_number_word = any(num in sentence for num in number_words)

        # If sentence mentions both numbers and currency/price, skip it
        if has_price or (has_number_word and any(ind in sentence.lower() for ind in price_indicators)):
            logger.debug(f"✗ Filtering price sentence: {sentence.strip()}")
            continue

        # Keep sentences that don't mention price
        if sentence.strip():
            filtered_sentences.append(sentence.strip())

    # Reconstruct response
    filtered_response = '. '.join(filtered_sentences)

    # Add period at end if not present
    if filtered_response and not filtered_response.endswith('.'):
        filtered_response += '.'

    if filtered_response != bot_response:
        logger.info(f"📝 Price filter applied - Original: {bot_response[:100]}...")
        logger.info(f"📝 Price filter applied - Filtered: {filtered_response[:100]}...")

    return filtered_response if filtered_response else bot_response


async def process_audio_chunk(audio_data: bytes, client_id: str) -> bool:
    """
    Process audio chunk through VAD to detect speech.

    Args:
        audio_data: Raw audio bytes
        client_id: Unique client identifier

    Returns:
        True if speech detected, False otherwise
    """
    try:
        audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        if len(audio_np) != CHUNK_SIZE:
            return False

        audio_tensor = torch.from_numpy(audio_np)
        speech_prob = vad_model(audio_tensor, SAMPLE_RATE).item()

        return speech_prob > VAD_THRESHOLD
    except Exception as e:
        logger.error(f"Error processing audio chunk: {e}")
        return False


async def send_to_asr(audio_buffer: bytes, language: str = "ta-IN") -> str:
    """
    Send audio to Sarvam ASR API for transcription.

    Args:
        audio_buffer: Complete audio buffer (raw PCM)
        language: Language code (default: "ta-IN" for Tamil)

    Returns:
        Transcribed text
    """
    try:
        if asr_service is None:
            logger.error("ASR service not initialized")
            return ""

        # Convert raw PCM to WAV format
        audio_np = np.frombuffer(audio_buffer, dtype=np.int16)
        
        # Create WAV file in memory
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(SAMPLE_RATE)  # 16kHz
            wav_file.writeframes(audio_np.tobytes())
        
        wav_bytes = wav_buffer.getvalue()
        
        # Send to ASR
        transcription = await asr_service.transcribe(wav_bytes, language)
        
        logger.info(f"ASR Transcription ({language}): {transcription}")
        return transcription
    except Exception as e:
        logger.error(f"ASR error: {e}")
        return ""


def detect_order_confirmation(user_input: str) -> bool:
    """
    Detect if user is confirming their order.
    Looks for confirmation keywords in Tamil and English.

    Args:
        user_input: User's transcribed message

    Returns:
        True if order confirmation detected
    """
    confirmation_keywords = [
        'confirm', 'கன்ஃபர்ம்', 'கன்பர்ம்', 'உறுதி', 'சரி', 'ஓகே', 'okay', 'ok',
        'சரிதான்', 'கண்ஃபார்ம்', 'ஆர்டர்', 'order', 'பண்ணு', 'போடு'
    ]

    user_lower = user_input.lower()
    return any(keyword in user_lower for keyword in confirmation_keywords)


async def stream_tts_by_sentence(text: str, websocket: WebSocket, client_state: dict):
    """
    Stream TTS audio by splitting text into sentences and processing each immediately.
    This enables faster audio playback by not waiting for the full text to be generated.

    Args:
        text: Full text to convert to speech
        websocket: WebSocket connection to stream audio chunks
        client_state: Client state containing language preference
    """
    if not tts_service or not text:
        return

    try:
        # Split text by sentences (split on periods, question marks, exclamation marks)
        import re
        sentences = re.split(r'([.!?]+)', text)

        # Recombine sentence with its punctuation
        combined_sentences = []
        for i in range(0, len(sentences) - 1, 2):
            sentence = sentences[i].strip()
            punct = sentences[i + 1] if i + 1 < len(sentences) else ''
            if sentence:
                combined_sentences.append(sentence + punct)

        # Add last sentence if it doesn't have punctuation
        if len(sentences) % 2 == 1 and sentences[-1].strip():
            combined_sentences.append(sentences[-1].strip())

        if not combined_sentences:
            logger.warning("No sentences found in text")
            return

        logger.info(f"Split text into {len(combined_sentences)} sentences for streaming TTS")

        # Signal that we're starting sentence-by-sentence generation
        await websocket.send_json({
            "type": "audio_stream_start",
            "total_sentences": len(combined_sentences)
        })

        language = client_state.get("language", "ta-IN")

        # Process each sentence
        for sentence_idx, sentence in enumerate(combined_sentences):
            logger.info(f"Processing sentence {sentence_idx + 1}/{len(combined_sentences)}: {sentence[:50]}...")

            # Signal sentence start
            await websocket.send_json({
                "type": "sentence_audio_start",
                "sentence_index": sentence_idx,
                "sentence_text": sentence
            })

            # Synthesize TTS audio for this sentence
            audio_bytes = await tts_service.synthesize(sentence, language)

            if audio_bytes:
                await websocket.send_bytes(audio_bytes)
                logger.info(f"Sentence {sentence_idx + 1} sent {len(audio_bytes)} bytes of audio")
            else:
                logger.warning(f"No audio generated for sentence {sentence_idx + 1}")

            # Signal sentence complete
            await websocket.send_json({
                "type": "sentence_audio_complete",
                "sentence_index": sentence_idx
            })

        # Send final completion signal
        await websocket.send_json({
            "type": "audio_stream_complete",
            "total_sentences": len(combined_sentences)
        })

        logger.info(f"All {len(combined_sentences)} sentences streamed successfully")

    except WebSocketDisconnect:
        logger.warning("WebSocket disconnected during TTS streaming")
    except Exception as e:
        logger.error(f"TTS sentence streaming failed: {e}")
        try:
            await websocket.send_json({
                "type": "audio_error",
                "message": "Speech generation failed"
            })
        except:
            pass


async def extract_order_items(client_state: dict) -> list:
    """
    Extract ordered items from conversation history.
    Looks for dish names and quantities in the conversation.

    Args:
        client_state: Client conversation state with history

    Returns:
        List of dicts with {"name": str, "qty": int}
    """
    # For now, return empty list - this would need NLP to parse conversation
    # In production, you'd extract from the LLM's order confirmation response
    # or maintain an order state in client_state
    return []


async def send_sentence_to_tts(sentence: str, sentence_idx: int, websocket: WebSocket, client_state: dict):
    """
    Send a single sentence to TTS and stream the audio to the websocket.
    This function is designed to be run as a parallel task for pipelining.

    Args:
        sentence: The sentence text to convert to speech
        sentence_idx: Index of the sentence (for logging/tracking)
        websocket: WebSocket connection to stream audio
        client_state: Client state containing language preference
    """
    if not tts_service or not sentence:
        return

    try:
        language = client_state.get("language", "ta-IN")

        # Signal sentence start
        await websocket.send_json({
            "type": "sentence_audio_start",
            "sentence_index": sentence_idx,
            "sentence_text": sentence
        })

        # Also send text response to frontend for this sentence
        await websocket.send_json({
            "type": "bot_response",
            "text": sentence
        })

        # Synthesize TTS audio for this sentence
        audio_bytes = await tts_service.synthesize(sentence, language)

        if audio_bytes:
            await websocket.send_bytes(audio_bytes)
            logger.info(f"✅ Sentence {sentence_idx} TTS complete: {len(audio_bytes)} bytes")
        else:
            logger.warning(f"⚠️ No audio generated for sentence {sentence_idx}")

        # Signal sentence complete
        await websocket.send_json({
            "type": "sentence_audio_complete",
            "sentence_index": sentence_idx
        })

    except WebSocketDisconnect:
        logger.warning(f"WebSocket disconnected during sentence {sentence_idx} TTS")
    except Exception as e:
        logger.error(f"TTS failed for sentence {sentence_idx}: {e}")


async def chat_with_llm_stream(user_input: str, client_state: dict, websocket: WebSocket):
    """
    Complete RAG + Tool Calling + Streaming pipeline:
    1. Search menu with Qdrant
    2. Build prompt with menu context
    3. Send to Groq LLM with tool definitions (streaming)
    4. Stream response text and split by sentences
    5. Send each sentence to TTS immediately
    6. Handle tool calls if needed

    Args:
        user_input: User's transcribed message
        client_state: Client conversation state
        websocket: WebSocket connection for streaming responses

    Returns:
        None (streams responses via websocket)
    """
    try:
        # Get current hour for meal period filtering
        current_hour = datetime.now().hour

        # Search menu with retriever - get ALL items (26 items is tiny for 131K context)
        logger.info(f"Searching menu for: {user_input}")
        results = vector_store_service.search_menu(
            user_input,
            current_hour=current_hour,
            top_k=50  # Get all items - menu is small, no need to limit
        )

        # Format menu context
        menu_context = vector_store_service.format_menu_context(results)
        logger.info(f"Retrieved {len(results)} menu items")

        # Build system prompt with menu context
        system_prompt = get_prompt_with_menu(menu_context)

        # Fix conversation history - ensure alternating roles
        cleaned_history = []
        last_role = None

        for msg in client_state["conversation_history"]:
            if msg['role'] != last_role:
                cleaned_history.append(msg)
                last_role = msg['role']
            else:
                logger.warning(f"Skipping duplicate {msg['role']} message to maintain alternation")

        client_state["conversation_history"] = cleaned_history

        # Add user message to history
        if cleaned_history and cleaned_history[-1]['role'] == 'user':
            logger.warning("Last message was from user, replacing with new user message")
            cleaned_history[-1] = {'role': 'user', 'content': user_input}
        else:
            cleaned_history.append({'role': 'user', 'content': user_input})

        # Prepare messages for LLM
        messages = [
            {'role': 'system', 'content': system_prompt}
        ] + cleaned_history

        # Log the conversation for debugging
        logger.debug(f"Conversation history roles: {[m['role'] for m in cleaned_history]}")

        # Initialize tool executor
        tool_executor = OrderToolExecutor(client_state)

        # Tool calling loop (max 5 iterations to prevent infinite loops)
        max_iterations = 5
        iteration = 0

        while iteration < max_iterations:
            iteration += 1
            logger.info(f"LLM call iteration {iteration}")

            # Get complete LLM response (non-streaming for reliability)
            tts_tasks = []  # Track TTS tasks for parallel processing
            sentence_count = 0

            # Call Groq API to get complete response
            logger.info("📤 Calling Groq API (non-streaming)...")

            try:
                # Call Groq API (non-streaming)
                # Using max_tokens=1000 for complete responses
                # Enable tools for order management
                response = await llm_service.chat(
                    messages,
                    temperature=0.3,  # Lower temp for reliable tool calling (Groq recommendation: 0.0-0.5)
                    max_tokens=1000,
                    tools=TOOLS  # Enable function calling
                )

                if response.get("type") == "tool_call":
                    # LLM wants to call tools
                    tool_calls = response.get("tool_calls", [])
                    logger.info(f"🔧 LLM requested {len(tool_calls)} tool call(s)")

                    # Execute all tool calls
                    for tool_call in tool_calls:
                        tool_name = tool_call["name"]
                        arguments = tool_call["arguments"]
                        tool_call_id = tool_call.get("id", "")

                        logger.info(f"🔧 Executing tool: {tool_name} with args: {arguments}")

                        # Execute the tool
                        result = await tool_executor.execute_tool(tool_name, arguments)
                        logger.info(f"✅ Tool {tool_name} result: {result}")

                        # Send real-time updates to frontend
                        if tool_name in ["add_item_to_order", "remove_item_from_order"]:
                            # Update cart display in real-time
                            await websocket.send_json({
                                "type": "order_update",
                                "current_order": client_state.get("current_order", []),
                                "total": sum(item.get("price", 0) * item.get("quantity", 0)
                                           for item in client_state.get("current_order", []))
                            })

                        elif tool_name == "confirm_and_save_order":
                            if result.get("success"):
                                # Order confirmed! Send confirmation to frontend
                                await websocket.send_json({
                                    "type": "order_confirmed",
                                    "order_id": result.get("order_id"),
                                    "items": result.get("items", []),
                                    "total": result.get("total", 0),
                                    "order_number": result.get("order_number"),
                                    "show_confirmation": True,
                                    "confirmation_duration": result.get("confirmation_duration", 10)
                                })
                                logger.info(f"📤 Sent order confirmation to frontend - Order #{result.get('order_id')}")
                            else:
                                # Order failed - notify frontend with error
                                logger.error(f"❌ Order confirmation failed: {result.get('error')}")
                                await websocket.send_json({
                                    "type": "order_failed",
                                    "error": result.get("error", "Unknown error"),
                                    "order_details": result.get("order_details", [])
                                })

                        # Add tool result to messages for LLM
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call_id,
                            "name": tool_name,
                            "content": json.dumps(result, ensure_ascii=False)
                        })

                    # Get LLM's final response after tool execution
                    logger.info("📤 Getting LLM's response after tool execution...")
                    final_response = await llm_service.chat(
                        messages,
                        temperature=0.3,
                        max_tokens=1000,
                        tools=TOOLS
                    )

                    # Handle response - could be text or another tool call
                    if final_response.get("type") == "text":
                        content = final_response.get("content", "")
                    elif final_response.get("type") == "tool_call":
                        # LLM wants to call more tools - this is OK, continue the loop
                        logger.info("🔄 LLM requested more tools after previous execution")
                        continue
                    else:
                        # If LLM doesn't return text, skip TTS
                        logger.warning("⚠️ LLM returned no text after tool execution")
                        content = ""  # Empty - will be skipped by TTS

                elif response.get("type") == "text":
                    content = response.get("content", "")
                    logger.info(f"✅ Groq response received: {content[:100]}...")

                    # Remove "System:" prefix if present
                    if content.startswith("சிஸ்டம்:"):
                        content = content[8:].strip()
                    elif content.startswith("System:"):
                        content = content[7:].strip()

                    # Apply price filter to remove price mentions if user didn't ask
                    content = filter_price_mentions(user_input, content)

                else:
                    logger.error("❌ Unexpected response type from Groq")
                    content = "மன்னிக்கவும், தொழில்நுட்ப சிக்கல்."

                # Send final text response to TTS
                if content.strip():
                    logger.info(f"📢 Sending complete response to TTS: {content[:50]}...")

                    # Signal audio stream start (for frontend to reset state)
                    await websocket.send_json({
                        "type": "audio_stream_start"
                    })

                    tts_task = asyncio.create_task(
                        send_sentence_to_tts(
                            content,
                            1,  # sentence number
                            websocket,
                            client_state
                        )
                    )
                    tts_tasks.append(tts_task)
                    sentence_count = 1
                else:
                    logger.warning("⚠️ No content to send to TTS")
                    sentence_count = 0

            except Exception as e:
                logger.error(f"❌ Error calling Groq: {e}")
                import traceback
                traceback.print_exc()
                content = "மன்னிக்கவும், பிழை ஏற்பட்டது."

                await websocket.send_json({"type": "audio_stream_start"})

                tts_task = asyncio.create_task(
                    send_sentence_to_tts(
                        content,
                        1,
                        websocket,
                        client_state
                    )
                )
                tts_tasks.append(tts_task)
                sentence_count = 1

            logger.info(f"📊 Response processing complete - sentence_count: {sentence_count}")

            # Wait for all TTS tasks to complete
            if tts_tasks:
                logger.info(f"⏳ Waiting for {len(tts_tasks)} TTS tasks to complete...")
                await asyncio.gather(*tts_tasks)
                logger.info("✅ All TTS tasks completed")

                # Send audio_stream_complete signal for frontend food item detection
                await websocket.send_json({
                    "type": "audio_stream_complete",
                    "total_sentences": sentence_count
                })
                logger.info("📤 Sent audio_stream_complete signal")

            # If we got text content, we're done
            if sentence_count > 0:
                logger.info(f"✅ Response complete with {sentence_count} sentence(s)")

                # Add actual response to history (content is already cleaned)
                if cleaned_history and cleaned_history[-1]['role'] == 'assistant':
                    logger.warning("Last message was from assistant, not adding to history")
                else:
                    logger.info(f"💾 Saving to history: {content[:100]}...")
                    cleaned_history.append({'role': 'assistant', 'content': content})

                client_state["conversation_history"] = cleaned_history
                return

            # If no content received, send error
            logger.error("❌ No content received from Groq")
            await websocket.send_json({
                "type": "bot_response",
                "text": "மன்னிக்கவும், என்னால் இப்போது பதிலளிக்க முடியவில்லை."
            })
            return

        # If we hit max iterations, return error
        logger.error("Max LLM iterations reached")
        await websocket.send_json({
            "type": "error",
            "message": "Sorry, I encountered an error processing your request."
        })
        return

    except RuntimeError as e:
        if "StopAsyncIteration" in str(e):
            logger.error(f"Chat streaming error (StopAsyncIteration): {e}")
            await websocket.send_json({
                "type": "bot_response",
                "text": "மன்னிக்கவும், பதிலை வழங்குவதில் சிக்கல். மீண்டும் முயற்சிக்கவும்."
            })
        else:
            logger.error(f"Chat runtime error: {e}")
            import traceback
            traceback.print_exc()
            await websocket.send_json({
                "type": "error",
                "message": "Runtime error occurred"
            })
    except Exception as e:
        logger.error(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        await websocket.send_json({
            "type": "error",
            "message": "An error occurred. Please try again."
        })


async def sync_qdrant_task():
    """Background task to sync Qdrant from PostgreSQL every 5 seconds"""
    await asyncio.sleep(60)  # Wait 1 minute before first sync (let everything initialize)

    while True:
        try:
            logger.info("Background sync: Syncing Qdrant from PostgreSQL...")
            if vector_store_service:
                await vector_store_service.sync_from_database()
            else:
                logger.warning("Vector store service not initialized, skipping sync")
        except Exception as e:
            logger.error(f"Background sync error: {e}")

        # Wait 5 seconds before next sync
        await asyncio.sleep(5)


@app.on_event("startup")
async def startup_event():
    """Initialize all services on application startup."""
    logger.info("Initializing database connection pool...")
    await db_service.initialize()

    init_vad()
    await init_vector_store()
    init_llm()
    init_tts()
    init_asr()

    logger.info("Starting background Qdrant sync task (every 5 seconds)...")
    asyncio.create_task(sync_qdrant_task())

    logger.info("All services initialized successfully!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Shutting down application...")
    await db_service.close()


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "vad_loaded": vad_model is not None,
        "vector_store_ready": vector_store_service is not None,
        "llm_ready": llm_service is not None,
        "tts_ready": tts_service is not None,
        "asr_ready": asr_service is not None,
        "database_ready": db_service.pool is not None
    }


@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio processing.

    Handles:
    - Audio streaming
    - VAD detection
    - ASR transcription
    - LLM chat responses
    """
    await websocket.accept()
    client_id = id(websocket)

    logger.info(f"Client {client_id} connected")

    # Initialize client state
    connections[client_id] = {
        "pre_roll_buffer": deque(maxlen=int(PRE_ROLL_MS / 1000 * SAMPLE_RATE / CHUNK_SIZE)),
        "speech_buffer": bytearray(),
        "is_speaking": False,
        "silence_chunks": 0,
        "language": "ta-IN",
        "conversation_history": [],
        "current_order": [],
        "asr_active": True,
        "order_status": "active",
        "last_tool_result": {},
        "order_count": 0,
        "completed_orders": []
    }

    try:
        await websocket.send_json({"type": "status", "message": "connected"})

        while True:
            data = await websocket.receive()

            if "bytes" in data:
                audio_chunk = data["bytes"]
                client_state = connections[client_id]

                # Check if ASR is active
                if not client_state.get("asr_active", True):
                    # ASR paused during order processing - ignore audio
                    continue

                # Run VAD on chunk
                is_speech = await process_audio_chunk(audio_chunk, client_id)

                if is_speech:
                    # Speech detected
                    if not client_state["is_speaking"]:
                        logger.info(f"Client {client_id}: Speech started")
                        client_state["is_speaking"] = True
                        for pre_chunk in client_state["pre_roll_buffer"]:
                            client_state["speech_buffer"].extend(pre_chunk)

                    client_state["speech_buffer"].extend(audio_chunk)
                    client_state["silence_chunks"] = 0

                else:
                    # Silence detected
                    if client_state["is_speaking"]:
                        client_state["speech_buffer"].extend(audio_chunk)
                        client_state["silence_chunks"] += 1

                        silence_duration_ms = (client_state["silence_chunks"] * CHUNK_SIZE / SAMPLE_RATE) * 1000

                        if silence_duration_ms >= MIN_SILENCE_MS:
                            logger.info(f"Client {client_id}: Speech ended, processing...")

                            # Send to ASR
                            transcription = await send_to_asr(
                                bytes(client_state["speech_buffer"]),
                                client_state["language"]
                            )

                            if transcription:
                                # Send transcription to frontend
                                await websocket.send_json({
                                    "type": "transcription",
                                    "text": transcription
                                })

                                # Get LLM response with RAG (streaming)
                                await chat_with_llm_stream(transcription, client_state, websocket)

                                # Check if order was confirmed
                                last_tool_result = client_state.get("last_tool_result", {})

                                if last_tool_result.get("ask_for_more"):
                                    # Order confirmed successfully!
                                    logger.info(f"✅ Order {last_tool_result['order_id']} confirmed")

                                    # Pause ASR temporarily
                                    await websocket.send_json({
                                        "type": "asr_pause",
                                        "reason": "order_processing"
                                    })

                                    # Send order confirmation to frontend
                                    await websocket.send_json({
                                        "type": "order_confirmed",
                                        "order_id": last_tool_result["order_id"],
                                        "total": last_tool_result["total"],
                                        "items": last_tool_result["items"],
                                        "message": f"ஆர்டர் #{last_tool_result['order_id']} கன்ஃபர்ம் ஆச்சு!"
                                    })

                                    # Generate confirmation TTS
                                    if tts_service:
                                        confirmation_text = f"ஆர்டர் #{last_tool_result['order_id']} கன்ஃபர்ம் ஆச்சு! பில் கிச்சனுக்கு போயிடுச்சு."
                                        audio_bytes = await tts_service.synthesize(confirmation_text)
                                        if audio_bytes:
                                            await websocket.send_json({
                                                "type": "confirmation_audio_start",
                                                "size": len(audio_bytes)
                                            })
                                            await websocket.send_bytes(audio_bytes)

                                    # Wait 2 seconds
                                    await asyncio.sleep(2)

                                    # Resume ASR for next order
                                    await websocket.send_json({
                                        "type": "asr_resume",
                                        "reason": "ready_for_more"
                                    })

                                    # Ask if they want more
                                    await websocket.send_json({
                                        "type": "ask_for_more",
                                        "message": "வேற எதாவது வேணுமா?"
                                    })

                                    # Generate "want more?" TTS
                                    if tts_service:
                                        more_text = "வேற எதாவது வேணுமா?"
                                        audio_bytes = await tts_service.synthesize(more_text)
                                        if audio_bytes:
                                            await websocket.send_bytes(audio_bytes)

                                elif last_tool_result.get("resume_asr"):
                                    # Print failed, resume ASR
                                    logger.warning("Print failed, resuming ASR")

                                    await websocket.send_json({
                                        "type": "order_failed",
                                        "error": last_tool_result.get("error"),
                                        "message": "பிரிண்டர் பிரச்சனை. மறுபடியும் try பண்ணுங்க."
                                    })

                                    await websocket.send_json({
                                        "type": "asr_resume"
                                    })

                            # Reset state
                            client_state["is_speaking"] = False
                            client_state["speech_buffer"].clear()
                            client_state["silence_chunks"] = 0
                    else:
                        client_state["pre_roll_buffer"].append(audio_chunk)

            elif "text" in data:
                import json
                try:
                    message = json.loads(data["text"])
                    if message.get("type") == "config":
                        connections[client_id]["language"] = message.get("language", "ta")
                        logger.info(f"Client {client_id}: Language set to {message.get('language')}")
                    elif message.get("type") == "reset":
                        connections[client_id]["conversation_history"].clear()
                        logger.info(f"Client {client_id}: Conversation reset")
                    elif message.get("type") == "start_ordering":
                        # Clear order state for new ordering session
                        connections[client_id]["current_order"] = []
                        connections[client_id]["asr_active"] = True
                        connections[client_id]["order_status"] = "active"
                        logger.info(f"Client {client_id}: New ordering session started, cart cleared")
                except:
                    pass

    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Error handling client {client_id}: {e}")
    finally:
        if client_id in connections:
            del connections[client_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
