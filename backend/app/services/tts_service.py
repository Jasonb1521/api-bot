"""
TTS Service for converting text to speech using Sarvam AI SDK
"""
import logging
import os
import base64
from typing import Optional, AsyncGenerator
from sarvamai import SarvamAI, AsyncSarvamAI, AudioOutput, EventResponse

logger = logging.getLogger(__name__)


class TTSService:
    def __init__(self, api_key: str = None):
        """
        Initialize TTS service with Sarvam AI SDK

        Args:
            api_key: Sarvam AI API key
        """
        if api_key is None:
            api_key = os.getenv("SARVAM_API_KEY")
            if not api_key:
                raise ValueError("SARVAM_API_KEY environment variable not set")

        self.client = SarvamAI(api_subscription_key=api_key)
        self.async_client = AsyncSarvamAI(api_subscription_key=api_key)
        logger.info("TTS service initialized with Sarvam AI SDK (sync + async)")

    async def synthesize(self, text: str, language: str = "ta-IN", speaker: str = "manisha") -> Optional[bytes]:
        """
        Synthesize speech from text using Sarvam AI SDK

        Args:
            text: Text to convert to speech (max 1500 characters)
            language: Language code (default: ta-IN for Tamil)
            speaker: Speaker voice (default: anushka) - Options: anushka, manisha, vidya, arya, abhilash, karun, hitesh

        Returns:
            Complete audio bytes or None if failed
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for TTS")
            return None

        try:
            logger.info(f"Synthesizing text: '{text[:100]}...' (length: {len(text)})")

            # Use Sarvam AI SDK for TTS - correct method is 'convert'
            response = self.client.text_to_speech.convert(
                text=text,  # Single text string (not a list)
                target_language_code=language,
                speaker=speaker,
                model="bulbul:v2",
                enable_preprocessing=True
            )

            # The response contains base64 encoded audio in audios array
            if hasattr(response, 'audios') and response.audios and len(response.audios) > 0:
                audio_base64 = response.audios[0]

                # Decode base64 to bytes
                import base64
                audio_data = base64.b64decode(audio_base64)

                logger.info(f"Successfully synthesized {len(audio_data)} bytes of audio")
                return audio_data
            else:
                logger.warning("No audio data in response")
                return None

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def synthesize_stream(
        self,
        text: str,
        language: str = "ta-IN",
        speaker: str = "manisha",
        output_codec: str = "mp3",
        min_buffer_size: int = 50
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream audio chunks in real-time using Sarvam AI WebSocket TTS.
        Audio generation starts immediately and chunks are yielded as they're generated.

        Args:
            text: Text to convert to speech
            language: Language code (default: ta-IN for Tamil)
            speaker: Speaker voice (default: manisha)
            output_codec: Audio format - mp3, wav, aac, opus, flac, pcm, mulaw, alaw (default: mp3)
            min_buffer_size: Minimum buffer size for flushing (default: 50 chars)

        Yields:
            Audio bytes chunks as they're generated
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for streaming TTS")
            return

        try:
            logger.info(f"🎵 Starting streaming TTS for: '{text[:100]}...' (length: {len(text)})")

            # Connect to Sarvam streaming TTS WebSocket
            async with self.async_client.text_to_speech_streaming.connect(
                model="bulbul:v2",
                send_completion_event=True
            ) as ws:
                # Configure TTS parameters
                await ws.configure(
                    target_language_code=language,
                    speaker=speaker,
                    output_audio_codec=output_codec,
                    min_buffer_size=min_buffer_size
                )
                logger.debug(f"✅ TTS WebSocket configured: {language}, {speaker}, {output_codec}")

                # Send text for conversion
                await ws.convert(text)
                logger.debug(f"📤 Sent text to TTS: {len(text)} chars")

                # Flush to ensure processing starts
                await ws.flush()
                logger.debug("🚀 TTS buffer flushed - streaming started")

                # Stream audio chunks as they arrive
                chunk_count = 0
                total_bytes = 0

                async for message in ws:
                    if isinstance(message, AudioOutput):
                        # Decode base64 audio chunk
                        audio_chunk = base64.b64decode(message.data.audio)
                        chunk_count += 1
                        total_bytes += len(audio_chunk)

                        logger.debug(f"📦 Chunk {chunk_count}: {len(audio_chunk)} bytes")
                        yield audio_chunk

                    elif isinstance(message, EventResponse):
                        logger.debug(f"📡 Event: {message.data.event_type}")
                        if message.data.event_type == "final":
                            logger.info(f"✅ Streaming complete: {chunk_count} chunks, {total_bytes} bytes total")
                            break

        except Exception as e:
            logger.error(f"❌ Streaming TTS failed: {e}")
            import traceback
            traceback.print_exc()

    async def close(self):
        """Clean up resources"""
        pass


# Global TTS service instance
tts_service: Optional[TTSService] = None


def init_tts_service(api_key: str = None):
    """
    Initialize global TTS service

    Args:
        api_key: Sarvam AI API key
    """
    global tts_service
    tts_service = TTSService(api_key=api_key)
    return tts_service


def get_tts_service() -> Optional[TTSService]:
    """Get the global TTS service instance"""
    return tts_service