"""LLM service for chat completions using Google Gemini API with native SDK."""

import logging
import os
import json
import google.generativeai as genai
from typing import AsyncGenerator

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with Google Gemini API using native SDK."""

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initialize Gemini client using native SDK.

        Args:
            api_key: Gemini API key
            model: Model to use for chat completions (default: gemini-1.5-flash)
        """
        if api_key is None:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set")

        if model is None:
            model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        # Configure Gemini with native SDK
        genai.configure(api_key=api_key)
        self.model_name = model

        # Create model instance with optimized generation config
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 200,
            }
        )
        logger.info(f"LLM service initialized with Gemini model {self.model_name}")

    async def chat_stream(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 512,
        tools: list = None
    ) -> AsyncGenerator[dict, None]:
        """
        Send streaming chat completion request to Gemini using native SDK.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens to generate
            tools: Optional list of tool definitions for function calling (ignored for now)

        Yields:
            dict chunks with streaming content
        """
        try:
            # Convert OpenAI-style messages to Gemini format
            # Gemini expects: system instruction + conversation contents
            system_instruction = None
            contents = []

            for msg in messages:
                role = msg.get("role")
                content = msg.get("content", "")

                if role == "system":
                    system_instruction = content
                elif role == "user":
                    contents.append({"role": "user", "parts": [content]})
                elif role == "assistant":
                    contents.append({"role": "model", "parts": [content]})

            # Create model with system instruction if present (NO safety settings like yesterday)
            if system_instruction:
                model_instance = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    },
                    system_instruction=system_instruction
                )
            else:
                model_instance = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    }
                )

            # Stream the response using generate_content_async directly with full conversation
            logger.info(f"🚀 Starting Gemini stream with {len(contents)} message(s)")
            logger.info(f"📝 System instruction: {system_instruction[:100] if system_instruction else 'None'}...")
            logger.info(f"📝 Contents: {contents}")

            try:
                response = await model_instance.generate_content_async(
                    contents,
                    stream=True
                )

                chunk_count = 0
                has_content = False

                # Properly iterate through the async generator
                try:
                    async for chunk in response:
                        chunk_count += 1
                        logger.debug(f"Raw chunk {chunk_count}: {chunk}")

                        # Extract text from chunk
                        if hasattr(chunk, 'text') and chunk.text:
                            has_content = True
                            yield {
                                "type": "content",
                                "content": chunk.text
                            }
                        elif hasattr(chunk, 'parts'):
                            # Handle parts-based response
                            for part in chunk.parts:
                                if hasattr(part, 'text') and part.text:
                                    has_content = True
                                    yield {
                                        "type": "content",
                                        "content": part.text
                                    }
                except StopAsyncIteration:
                    # Handle the StopAsyncIteration properly - this is expected at the end
                    logger.debug("Stream iterator completed normally")

                # If no content was received, check for blocking
                if not has_content:
                    logger.warning("No content received from Gemini - possible safety filter block")
                    yield {
                        "type": "content",
                        "content": "மன்னிக்கவும், உங்கள் கோரிக்கையை செயலாக்க முடியவில்லை."
                    }

                # Signal completion
                yield {
                    "type": "done",
                    "finish_reason": "stop"
                }

                logger.info(f"✅ Stream completed with {chunk_count} total chunks")

            except StopAsyncIteration:
                # Catch at outer level too
                logger.warning("Stream ended prematurely with StopAsyncIteration")
                yield {
                    "type": "content",
                    "content": "மன்னிக்கவும், பதிலை முழுமையாக வழங்க முடியவில்லை."
                }
                yield {
                    "type": "done",
                    "finish_reason": "error"
                }

        except Exception as e:
            logger.error(f"Gemini streaming chat error: {e}")
            import traceback
            traceback.print_exc()
            raise

    async def chat(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 512,
        tools: list = None
    ) -> dict:
        """
        Send chat completion request to Gemini using native SDK (non-streaming).

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens to generate
            tools: Optional list of tool definitions for function calling (ignored for now)

        Returns:
            dict with 'type' ('text'), 'content'
        """
        try:
            # Convert OpenAI-style messages to Gemini format
            system_instruction = None
            contents = []

            for msg in messages:
                role = msg.get("role")
                content = msg.get("content", "")

                if role == "system":
                    system_instruction = content
                elif role == "user":
                    contents.append({"role": "user", "parts": [content]})
                elif role == "assistant":
                    contents.append({"role": "model", "parts": [content]})

            # Create model with system instruction if present (NO safety settings like yesterday)
            if system_instruction:
                model_instance = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    },
                    system_instruction=system_instruction
                )
            else:
                model_instance = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    }
                )

            # Send message using generate_content_async with full conversation
            logger.info(f"📤 Sending {len(contents)} message(s) to Gemini")
            response = await model_instance.generate_content_async(contents)

            # Log response details
            logger.info(f"📊 Gemini Response received")

            # Log full response for debugging
            logger.info(f"📊 Full response object: {response}")

            # Check prompt feedback first (prompt-level blocking)
            if hasattr(response, 'prompt_feedback'):
                logger.info(f"📊 Prompt feedback: {response.prompt_feedback}")
                if hasattr(response.prompt_feedback, 'block_reason'):
                    logger.error(f"❌ Prompt was blocked: {response.prompt_feedback.block_reason}")
                    if hasattr(response.prompt_feedback, 'safety_ratings'):
                        logger.error(f"❌ Prompt safety ratings: {response.prompt_feedback.safety_ratings}")

            # Check if response was blocked by safety filters
            if not response.candidates:
                logger.error("❌ Gemini returned no candidates (likely blocked at prompt level)")
                return {
                    "type": "text",
                    "content": "மன்னிக்கவும், பதிலை வழங்க முடியவில்லை."
                }

            candidate = response.candidates[0]

            # Check finish reason
            finish_reason = candidate.finish_reason
            logger.info(f"📊 Finish reason: {finish_reason} (type: {type(finish_reason)})")

            # Import FinishReason enum for proper checking
            from google.generativeai.types import FinishReason

            # Check if blocked by safety (finish_reason == 3, not 2!)
            if finish_reason == FinishReason.SAFETY:  # Correct check
                logger.warning("⚠️ Response blocked by Gemini safety filters")
                if hasattr(candidate, 'safety_ratings'):
                    logger.warning(f"Safety ratings: {candidate.safety_ratings}")
                logger.warning(f"Full candidate: {candidate}")
                return {
                    "type": "text",
                    "content": "மன்னிக்கவும், பதிலை வழங்க முடியவில்லை."
                }

            # Check if hit max tokens limit
            if finish_reason == FinishReason.MAX_TOKENS:
                logger.warning("⚠️ Response hit MAX_TOKENS limit - response may be incomplete")
                # Continue to try to extract text anyway

            # Try to extract text safely
            try:
                # Check if candidate has content with parts
                if not hasattr(candidate, 'content') or not hasattr(candidate.content, 'parts') or not candidate.content.parts:
                    logger.error("❌ No content parts in response (likely MAX_TOKENS with no output)")
                    return {
                        "type": "text",
                        "content": "மன்னிக்கவும், என்னால் இப்போது பதிலளிக்க முடியவில்லை."
                    }

                if not response.text or not response.text.strip():
                    logger.warning("Gemini returned empty content")
                    return {
                        "type": "text",
                        "content": "மன்னிக்கவும், என்னால் இப்போது பதிலளிக்க முடியவில்லை."
                    }
                content = response.text.strip()
            except ValueError as e:
                logger.error(f"❌ Error accessing response.text: {e}")
                return {
                    "type": "text",
                    "content": "மன்னிக்கவும், பதிலை வழங்க முடியவில்லை."
                }

            # Remove "System:" prefix if Gemini adds it (in Tamil or English)
            if content.startswith("சிஸ்டம்:"):
                content = content[8:].strip()  # Remove "சிஸ்டம்: "
            elif content.startswith("System:"):
                content = content[7:].strip()  # Remove "System: "

            # Limit to first 5 sentences
            sentences = []
            current_sentence = ""
            for char in content:
                current_sentence += char
                if char == '.' and len(current_sentence.strip()) > 10:
                    sentences.append(current_sentence.strip())
                    current_sentence = ""
                    if len(sentences) >= 5:
                        break

            if current_sentence.strip() and len(sentences) < 5:
                sentences.append(current_sentence.strip())

            result = ' '.join(sentences[:5])

            return {
                "type": "text",
                "content": result
            }

        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            import traceback
            traceback.print_exc()
            raise
