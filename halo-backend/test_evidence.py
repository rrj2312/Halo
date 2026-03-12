# test_evidence.py
from evidence import generate_evidence_id, upload_evidence

# Fake audio bytes to simulate a real upload
fake_audio = b"fake audio data for testing halo evidence system"

evidence_id = generate_evidence_id(fake_audio)
print("Generated ID:", evidence_id)

result = upload_evidence(fake_audio, evidence_id, "cab")
print("Result:", result)