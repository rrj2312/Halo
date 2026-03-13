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

        if not transcript.strip():
            return jsonify({
                "threat_level": "SAFE",
                "reason": "No speech detected.",
                "flagged_phrase": None,
                "transcript": ""
            })

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
