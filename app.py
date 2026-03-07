import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from transcribe import transcribe_audio
from location import check_following, check_speed_matching

app = Flask(__name__)
CORS(app)  # Allow Bolt frontend to call this API

# ── In-memory journey store ───────────────────────────────────────────────────
# Holds threat events for the current journey (resets on new journey start)
journey_data = {
    "active": False,
    "mode": None,
    "threat_moments": [],       # list of { time, threat_level, reason, transcript }
    "safety_score": 100,        # starts at 100, decreases with warnings/dangers
}


# ═════════════════════════════════════════════════════════════════════════════
#  DATA LAYER ROUTES  (built by data-layer dev)
# ═════════════════════════════════════════════════════════════════════════════

# ── POST /journey/start ───────────────────────────────────────────────────────
@app.route("/journey/start", methods=["POST"])
def start_journey():
    """Called when user hits 'Start PRAHARI'. Resets journey store."""
    data = request.get_json()
    mode = data.get("mode", "unknown")

    journey_data["active"] = True
    journey_data["mode"] = mode
    journey_data["threat_moments"] = []
    journey_data["safety_score"] = 100

    return jsonify({"started": True, "mode": mode})


# ── POST /journey/end ─────────────────────────────────────────────────────────
@app.route("/journey/end", methods=["POST"])
def end_journey():
    """Called when user hits 'End Journey'. Marks journey inactive."""
    journey_data["active"] = False
    return jsonify({"ended": True})


# ── POST /location ────────────────────────────────────────────────────────────
@app.route("/location", methods=["POST"])
def location():
    """
    Checks if someone is following her based on GPS path comparison.

    Expects JSON:
    {
        "her_path":      [{"lat": 12.9, "lng": 77.6}, ...],
        "suspect_path":  [{"lat": 12.9, "lng": 77.6}, ...],
        "her_speeds":    [1.2, 1.4, 0.8, ...],     (optional)
        "suspect_speeds":[1.1, 1.3, 0.9, ...]      (optional)
    }

    Returns:
    {
        "following":       true/false,
        "confidence":      0–100,
        "reason":          "Confirmed mirroring across 3 turns",
        "speed_matching":  true/false
    }
    """
    data = request.get_json()

    her_path = data.get("her_path", [])
    suspect_path = data.get("suspect_path", [])
    her_speeds = data.get("her_speeds", [])
    suspect_speeds = data.get("suspect_speeds", [])

    if not her_path or not suspect_path:
        return jsonify({"error": "her_path and suspect_path are required"}), 400

    result = check_following(her_path, suspect_path)

    speed_match = False
    if her_speeds and suspect_speeds:
        speed_match = check_speed_matching(her_speeds, suspect_speeds)

    return jsonify({
        "following": result["following"],
        "confidence": result["confidence"],
        "reason": result["reason"],
        "speed_matching": speed_match,
    })


# ── POST /contact ─────────────────────────────────────────────────────────────
@app.route("/contact", methods=["POST"])
def save_contact():
    """
    Saves emergency contact to in-memory store (or extend to write to a file/db).

    Expects JSON:
    {
        "name":  "Priya",
        "phone": "+919876543210"
    }

    Returns:
    {
        "saved": true,
        "name":  "Priya",
        "phone": "+919876543210"
    }
    """
    data = request.get_json()
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()

    if not name or not phone:
        return jsonify({"error": "name and phone are required"}), 400

    # Store in app config (persists for server lifetime)
    app.config["EMERGENCY_CONTACT"] = {"name": name, "phone": phone}

    return jsonify({"saved": True, "name": name, "phone": phone})


# ── GET /report ───────────────────────────────────────────────────────────────
@app.route("/report", methods=["GET"])
def get_report():
    """
    Returns the journey summary after 'End Journey' is hit.

    Returns:
    {
        "mode":           "cab",
        "safety_score":   74,
        "threat_moments": [
            {
                "time":         "10:47 PM",
                "threat_level": "WARNING",
                "reason":       "Driver asked where she lives",
                "transcript":   "So where exactly do you stay?"
            }
        ],
        "summary": "3 warning signals detected. Stay alert next time."
    }
    """
    moments = journey_data.get("threat_moments", [])
    score = journey_data.get("safety_score", 100)
    mode = journey_data.get("mode", "unknown")

    warning_count = sum(1 for m in moments if m.get("threat_level") == "WARNING")
    danger_count  = sum(1 for m in moments if m.get("threat_level") == "DANGER")

    if danger_count > 0:
        summary = f"{danger_count} danger alert(s) and {warning_count} warning(s) detected. Please review the moments below."
    elif warning_count > 0:
        summary = f"{warning_count} suspicious moment(s) detected. Stay alert in future journeys."
    else:
        summary = "No threats detected. Safe journey!"

    return jsonify({
        "mode": mode,
        "safety_score": score,
        "threat_moments": moments,
        "summary": summary,
    })


# ═════════════════════════════════════════════════════════════════════════════
#  !! AI BRAIN DEV — ADD YOUR /analyze ROUTE BELOW THIS LINE !!
#  Do NOT touch anything above. Just add your route here.
#  You'll need to import: from threat_engine import analyze_threat
# ═════════════════════════════════════════════════════════════════════════════

# ── POST /analyze ─────────────────────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Halo AI Brain — analyzes audio for threats.

    Expects FormData:
    {
        "audio": <audio file>,
        "mode":  "cab" | "walking" | "bus" | "elevator" | "date" | "workplace"
    }

    Returns:
    {
        "threat_level":   "SAFE" | "WARNING" | "DANGER",
        "reason":         "short string",
        "flagged_phrase": "exact phrase or null",
        "transcript":     "full transcribed text"
    }
    """
    from threat_engine import analyze_threat
    from datetime import datetime

    try:
        # Get mode from request
        mode = request.form.get("mode", "cab")

        # Make sure audio was actually sent
        if "audio" not in request.files:
            return jsonify({
                "threat_level": "SAFE",
                "reason": "No audio received by Halo.",
                "flagged_phrase": None,
                "transcript": ""
            }), 400

        # Read the audio bytes
        audio_file = request.files["audio"]
        audio_bytes = audio_file.read()
        filename = audio_file.filename or "audio.webm"

        # Step 1: Audio → Text (her transcribe function)
        transcript = transcribe_audio(audio_bytes, filename)

        # Step 2: Text → Threat Level (your analyze function)
        result = analyze_threat(transcript, mode)

        # Step 3: Log it if WARNING or DANGER (her helper function)
        if result["threat_level"] in ("WARNING", "DANGER"):
            time_str = datetime.now().strftime("%I:%M %p")
            log_threat_moment(
                threat_level=result["threat_level"],
                reason=result["reason"],
                transcript=transcript,
                time_str=time_str
            )

        # Step 4: Return result to frontend
        return jsonify({
            "threat_level": result["threat_level"],
            "reason": result["reason"],
            "flagged_phrase": result["flagged_phrase"],
            "transcript": transcript
        })

    except Exception as e:
        return jsonify({
            "threat_level": "SAFE",
            "reason": "Halo error: " + str(e),
            "flagged_phrase": None,
            "transcript": ""
        }), 500

# ═════════════════════════════════════════════════════════════════════════════
#  INTERNAL HELPER — called by /analyze to log threat moments into journey_data
#  (AI Brain dev: call this after you get a WARNING or DANGER result)
# ═════════════════════════════════════════════════════════════════════════════

def log_threat_moment(threat_level: str, reason: str, transcript: str, time_str: str):
    """
    Logs a WARNING or DANGER moment into the journey store.
    Call this from /analyze whenever threat_level is not SAFE.

    Args:
        threat_level: "WARNING" or "DANGER"
        reason:       Short reason string from threat engine
        transcript:   The transcribed text that triggered the alert
        time_str:     Human-readable time e.g. "10:47 PM"
    """
    if threat_level == "SAFE":
        return

    journey_data["threat_moments"].append({
        "time": time_str,
        "threat_level": threat_level,
        "reason": reason,
        "transcript": transcript,
    })

    # Deduct from safety score
    if threat_level == "WARNING":
        journey_data["safety_score"] = max(0, journey_data["safety_score"] - 10)
    elif threat_level == "DANGER":
        journey_data["safety_score"] = max(0, journey_data["safety_score"] - 25)


# ── Run server ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)