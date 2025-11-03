"""
TTS Service for converting text to speech using Sarvam AI SDK
"""
import logging
import os
from typing import Optional
from sarvamai import SarvamAI

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
        logger.info("TTS service initialized with Sarvam AI SDK")

    async def synthesize(self, text: str, language: str = "ta-IN", speaker: str = "anushka") -> Optional[bytes]:
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