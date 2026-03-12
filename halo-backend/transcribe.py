from dotenv import load_dotenv
load_dotenv()
import os
import tempfile
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Takes raw audio bytes, sends to Groq Whisper, returns transcript as plain text.

    Args:
        audio_bytes: Raw audio data (webm, mp3, wav, m4a all supported)
        filename:    Original filename — Groq uses extension to detect format

    Returns:
        Transcribed text string, or empty string if transcription fails
    """
    try:
        # Write bytes to a temp file — Groq SDK needs a file-like object
        with tempfile.NamedTemporaryFile(suffix=f"_{filename}", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=(filename, audio_file),
                response_format="text"   # language parameter removed
            )

        # Clean up temp file
        os.unlink(tmp_path)

        return transcription.strip() if transcription else ""

    except Exception as e:
        print(f"[transcribe] ERROR: {e}")
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        return ""