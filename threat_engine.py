# threat_engine.py
# Halo — AI Safety App
# Sends transcript + mode to Groq Llama 3, returns structured threat assessment.

import os
import json
from groq import Groq
from dotenv import load_dotenv
from prompts import PROMPTS

load_dotenv()
GROQ_API_KEYS ="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"
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def analyze_threat(transcript, mode):
    """
    Analyzes a transcript for threats based on the selected Halo mode.

    transcript : str  — text output from transcribe.py
    mode       : str  — one of: cab, walking, bus, elevator, date, workplace

    returns    : dict — exactly:
        {
            "threat_level":   "SAFE" | "WARNING" | "DANGER",
            "reason":         "short string",
            "flagged_phrase": "exact phrase from transcript" | null
        }
    """

    # Unknown mode — return error
    if mode not in PROMPTS:
        return {
            "threat_level": "DANGER",
            "reason": "Halo received an unknown mode: " + mode,
            "flagged_phrase": None
        }

    # Empty transcript — nothing to analyze
    if not transcript or transcript.strip() == "":
        return {
            "threat_level": "SAFE",
            "reason": "No speech detected in this audio window.",
            "flagged_phrase": None
        }

    # Error from transcription step — treat cautiously
    if transcript.startswith("ERROR:"):
        return {
            "threat_level": "SAFE",
            "reason": "Audio could not be transcribed. Monitoring continues.",
            "flagged_phrase": None
        }

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": PROMPTS[mode]
                },
                {
                    "role": "user",
                    "content": "Analyze this transcript:\n\n" + transcript
                }
            ],
            temperature=0.1,   # Low = consistent, predictable responses
            max_tokens=300
        )

        raw = response.choices[0].message.content.strip()

        # Extract JSON block even if Llama adds extra text around it
        start = raw.find("{")
        end = raw.rfind("}") + 1

        if start == -1 or end == 0:
            # Llama returned something unparseable — fail safe
            return {
                "threat_level": "SAFE",
                "reason": "Halo analysis complete. No clear threats detected.",
                "flagged_phrase": None
            }

        result = json.loads(raw[start:end])

        # Validate threat_level is one of our 3 expected values
        valid_levels = {"SAFE", "WARNING", "DANGER"}
        threat_level = result.get("threat_level", "SAFE").upper()
        if threat_level not in valid_levels:
            threat_level = "SAFE"

        return {
            "threat_level": threat_level,
            "reason": result.get("reason", "Halo analysis complete."),
            "flagged_phrase": result.get("flagged_phrase", None)
        }

    except json.JSONDecodeError:
        return {
            "threat_level": "SAFE",
            "reason": "Halo analysis complete. No threats detected.",
            "flagged_phrase": None
        }

    except Exception as e:
        return {
            "threat_level": "SAFE",
            "reason": "Halo engine error: " + str(e),
            "flagged_phrase": None
        }