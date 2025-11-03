"""LLM service for chat completions using Groq API with streaming support."""

import logging
import os
import json
from groq import AsyncGroq
from typing import AsyncGenerator

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with Groq API."""

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initialize Groq client.

        Args:
            api_key: Groq API key
            model: Model to use for chat completions (default: llama-3.3-70b-versatile)
        """
        if api_key is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY environment variable not set")

        if model is None:
            model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

        self.client = AsyncGroq(api_key=api_key)
        self.model_name = model
        logger.info(f"LLM service initialized with Groq model {self.model_name}")

    async def chat_stream(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 512,
        tools: list = None
    ) -> AsyncGenerator[dict, None]:
        """
        Send streaming chat completion request to Groq.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens to generate
            tools: Optional list of tool definitions for function calling

        Yields:
            dict chunks with streaming content or tool calls
        """
        try:
            # Groq uses OpenAI-compatible format directly
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                tools=tools if tools else None,
                stream=True
            )

            async for chunk in stream:
                if not chunk.choices:
                    continue

                choice = chunk.choices[0]
                delta = choice.delta

                # Handle content streaming
                if delta.content:
                    yield {
                        "type": "content",
                        "content": delta.content
                    }

                # Handle tool calls
                if delta.tool_calls:
                    for tool_call in delta.tool_calls:
                        yield {
                            "type": "tool_call_delta",
                            "tool_call": {
                                "id": tool_call.id if hasattr(tool_call, 'id') else None,
                                "name": tool_call.function.name if tool_call.function else None,
                                "arguments": tool_call.function.arguments if tool_call.function else None
                            }
                        }

                # Check if done
                if choice.finish_reason:
                    yield {
                        "type": "done",
                        "finish_reason": choice.finish_reason
                    }

        except Exception as e:
            logger.error(f"Groq streaming chat error: {e}")
            raise

    async def chat(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 512,
        tools: list = None,
        tool_choice: str = None
    ) -> dict:
        """
        Send chat completion request to Groq (non-streaming, for compatibility).

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens to generate
            tools: Optional list of tool definitions for function calling
            tool_choice: Control tool calling behavior ("auto", "none", "required")
                        - "auto": LLM decides whether to call tools (default)
                        - "none": Force LLM to generate text response only (useful after tool execution)
                        - "required": Force LLM to call at least one tool

        Returns:
            dict with 'type' ('text' or 'tool_call'), 'content', and optional 'tool_calls'
        """
        try:
            # Groq uses OpenAI-compatible format directly
            # Build kwargs dynamically to avoid sending None values
            kwargs = {
                "model": self.model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            # Only add tools if provided
            if tools:
                kwargs["tools"] = tools
                kwargs["parallel_tool_calls"] = True  # Enable parallel tool calling

                # Add tool_choice if specified
                if tool_choice:
                    kwargs["tool_choice"] = tool_choice

            response = await self.client.chat.completions.create(**kwargs)

            choice = response.choices[0]
            message = choice.message

            # Check for tool calls
            if message.tool_calls:
                tool_calls = []
                for tc in message.tool_calls:
                    tool_calls.append({
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": json.loads(tc.function.arguments)
                    })

                logger.info(f"🔧 Groq requested {len(tool_calls)} tool call(s)")
                return {
                    "type": "tool_call",
                    "tool_calls": tool_calls
                }

            # Regular text response
            # Handle case where content might be None (common after tool calls)
            if message.content is None:
                logger.warning("⚠️ LLM returned None content (no text response)")
                return {
                    "type": "text",
                    "content": ""
                }

            content = message.content.strip()

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
            logger.error(f"Groq chat error: {e}")
            raise
