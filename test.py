from dotenv import load_dotenv
load_dotenv()

from transcribe import transcribe_audio

# Read a real audio file and test it
with open("test_audio.mp3", "rb") as f:
    audio_bytes = f.read()

result = transcribe_audio(audio_bytes, "test_audio.mp3")
print("Transcript:", result)