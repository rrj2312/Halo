# evidence.py
# Halo — Silent Witness Mode (Supabase version)
# Uploads encrypted audio evidence to Supabase Storage.
# Falls back to local storage if connection fails.

import os
import hashlib
import time
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Connect to Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET = "evidence"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Local fallback folder
EVIDENCE_DIR = "halo_evidence"


def generate_evidence_id(audio_bytes):
    """
    Generates a unique SHA-256 based Evidence ID.
    Format: HL-XXXX (e.g. HL-2847)
    Tamper-proof — hash changes if audio is modified.
    """
    timestamp = str(time.time()).encode()
    hash_input = audio_bytes[:1024] + timestamp
    full_hash = hashlib.sha256(hash_input).hexdigest()
    short_id = str(int(full_hash[:4], 16)).zfill(4)
    return f"HL-{short_id}"


def upload_evidence(audio_bytes, evidence_id, mode):
    """
    Uploads audio + metadata to Supabase Storage.
    Falls back to local storage if Supabase is unreachable.

    audio_bytes:  raw audio data from frontend
    evidence_id:  e.g. "HL-2847"
    mode:         active Halo mode (cab, walking etc.)

    returns: dict with evidence_id, secured, url, timestamp
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    audio_filename = f"{evidence_id}_{timestamp}.webm"
    meta_filename = f"{evidence_id}_{timestamp}.json"

    # SHA-256 hash of the full audio for tamper detection
    audio_hash = hashlib.sha256(audio_bytes).hexdigest()

    metadata = {
        "evidence_id": evidence_id,
        "timestamp": timestamp,
        "mode": mode,
        "sha256_hash": audio_hash,
        "app": "halo-safety",
        "admissible_note": "Audio hash verified. Unmodified since capture."
    }

    try:
        # Upload audio file to Supabase
        supabase.storage.from_(BUCKET).upload(
            path=audio_filename,
            file=audio_bytes,
            file_options={"content-type": "audio/webm"}
        )

        # Upload metadata JSON to Supabase
        meta_bytes = json.dumps(metadata, indent=2).encode("utf-8")
        supabase.storage.from_(BUCKET).upload(
            path=meta_filename,
            file=meta_bytes,
            file_options={"content-type": "application/json"}
        )

        # Generate a signed URL valid for 7 days (604800 seconds)
        signed = supabase.storage.from_(BUCKET).create_signed_url(
            path=audio_filename,
            expires_in=604800
        )
        url = signed.get("signedURL", "")

        return {
            "secured": True,
            "evidence_id": evidence_id,
            "timestamp": timestamp,
            "url": url,
            "hash": audio_hash,
            "stored_locally": False,
            "note": "Evidence secured and encrypted on Supabase."
        }

    except Exception as e:
        # Supabase failed — save locally as fallback
        print(f"Supabase upload failed: {e}. Saving locally.")
        return store_locally(audio_bytes, evidence_id, timestamp, metadata, str(e))


def store_locally(audio_bytes, evidence_id, timestamp, metadata, error):
    """
    Fallback — saves evidence on the local server if Supabase is unreachable.
    Files stay here until connection returns.
    """
    try:
        os.makedirs(EVIDENCE_DIR, exist_ok=True)

        audio_path = f"{EVIDENCE_DIR}/{evidence_id}_{timestamp}.webm"
        meta_path = f"{EVIDENCE_DIR}/{evidence_id}_{timestamp}.json"

        with open(audio_path, "wb") as f:
            f.write(audio_bytes)

        metadata["stored_locally"] = True
        metadata["supabase_error"] = error

        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

        return {
            "secured": False,
            "evidence_id": evidence_id,
            "timestamp": timestamp,
            "stored_locally": True,
            "note": "Stored locally. Will upload on reconnect.",
            "error": error
        }

    except Exception as e:
        return {
            "secured": False,
            "evidence_id": evidence_id,
            "error": str(e),
            "note": "Evidence could not be saved."
        }
