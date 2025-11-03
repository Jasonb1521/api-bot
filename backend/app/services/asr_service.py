"""
ASR Service for speech-to-text using Sarvam AI SDK
"""
import logging
import os
import io
from typing import Optional
from sarvamai import SarvamAI

logger = logging.getLogger(__name__)


class ASRService:
    def __init__(self, api_key: str = None):
        """
        Initialize ASR service with Sarvam AI SDK

        Args:
            api_key: Sarvam AI API key
        """
        if api_key is None:
            api_key = os.getenv("SARVAM_API_KEY")
            if not api_key:
                raise ValueError("SARVAM_API_KEY environment variable not set")

        self.client = SarvamAI(api_subscription_key=api_key)
        logger.info("ASR service initialized with Sarvam AI SDK")

    async def transcribe(self, audio_bytes: bytes, language: str = "ta-IN") -> str:
        """
        Transcribe audio to text using Sarvam AI SDK

        Args:
            audio_bytes: Raw audio bytes (WAV format)
            language: Language code (default: ta-IN for Tamil)

        Returns:
            Complete transcribed text
        """
        if not audio_bytes:
            logger.warning("Empty audio provided for ASR")
            return ""

        try:
            logger.info(f"Transcribing audio ({len(audio_bytes)} bytes) in language: {language}")

            # Create a file-like object from audio bytes
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "audio.wav"  # Required by the SDK

            # Use Sarvam AI SDK for transcription
            response = self.client.speech_to_text.transcribe(
                file=audio_file,
                language_code=language,
                model="saarika:v2"
            )

            transcription = response.transcript if hasattr(response, 'transcript') else ""
            logger.info(f"ASR Transcription: {transcription}")
            return transcription

        except Exception as e:
            logger.error(f"ASR transcription failed: {e}")
            import traceback
            traceback.print_exc()
            return ""

    async def close(self):
        """Clean up resources"""
        pass


# Global ASR service instance
asr_service: Optional[ASRService] = None


def init_asr_service(api_key: str = None):
    """
    Initialize global ASR service

    Args:
        api_key: Sarvam AI API key
    """
    global asr_service
    asr_service = ASRService(api_key=api_key)
    return asr_service


def get_asr_service() -> Optional[ASRService]:
    """Get the global ASR service instance"""
    return asr_service
