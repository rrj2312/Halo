import math
from typing import TypedDict


# ── Types ────────────────────────────────────────────────────────────────────

class LatLng(TypedDict):
    lat: float
    lng: float

class FollowingResult(TypedDict):
    following: bool
    confidence: int          # 0–100
    reason: str


# ── Haversine distance (meters between two lat/lng points) ───────────────────

def haversine(p1: LatLng, p2: LatLng) -> float:
    """Returns distance in meters between two GPS coordinates."""
    R = 6_371_000  # Earth radius in metres

    lat1, lon1 = math.radians(p1["lat"]), math.radians(p1["lng"])
    lat2, lon2 = math.radians(p2["lat"]), math.radians(p2["lng"])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


# ── Bearing between two points (degrees 0–360) ───────────────────────────────

def bearing(p1: LatLng, p2: LatLng) -> float:
    """Returns compass bearing from p1 → p2 in degrees."""
    lat1 = math.radians(p1["lat"])
    lat2 = math.radians(p2["lat"])
    dlon = math.radians(p2["lng"] - p1["lng"])

    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)

    return (math.degrees(math.atan2(x, y)) + 360) % 360


# ── Core: check if someone is mirroring her path ─────────────────────────────

def check_following(
    her_path: list[LatLng],
    suspect_path: list[LatLng],
    distance_threshold_m: float = 80.0,    # max gap to count as "following"
    bearing_threshold_deg: float = 45.0,   # max bearing difference to count as same direction
) -> FollowingResult:
    """
    Compares two GPS paths to detect if the suspect is mirroring her movement.

    Logic:
    - At each timestep, compute distance between her and suspect
    - Compute bearing of both (are they going the same direction?)
    - A "follow event" = within distance threshold AND same bearing direction
    - Confidence scales with how many consecutive follow events occurred

    Args:
        her_path:      List of her GPS points in chronological order
        suspect_path:  List of suspect's GPS points (same length, same timestamps)
        distance_threshold_m:  How close counts as following (default 80m)
        bearing_threshold_deg: How aligned bearings must be (default ±45°)

    Returns:
        FollowingResult with following bool, confidence 0–100, and reason string
    """

    # Need at least 3 points to detect mirroring (spec: WARNING at 2 turns, DANGER at 3+)
    if len(her_path) < 2 or len(suspect_path) < 2:
        return FollowingResult(
            following=False,
            confidence=0,
            reason="Insufficient data points for analysis"
        )

    n = min(len(her_path), len(suspect_path))
    follow_events = 0
    distances = []
    bearing_diffs = []

    for i in range(n):
        dist = haversine(her_path[i], suspect_path[i])
        distances.append(dist)

        # Check bearing alignment (need at least 2 points to compute bearing)
        if i > 0:
            her_bearing = bearing(her_path[i - 1], her_path[i])
            sus_bearing = bearing(suspect_path[i - 1], suspect_path[i])

            # Normalize bearing difference to 0–180
            diff = abs(her_bearing - sus_bearing) % 360
            if diff > 180:
                diff = 360 - diff
            bearing_diffs.append(diff)

            same_direction = diff <= bearing_threshold_deg
            close_enough = dist <= distance_threshold_m

            if close_enough and same_direction:
                follow_events += 1

    # ── Confidence calculation ────────────────────────────────────────────────
    # Base: ratio of follow events to total comparable steps
    comparable_steps = n - 1  # first step has no bearing
    if comparable_steps == 0:
        return FollowingResult(following=False, confidence=0, reason="Not enough movement data")

    follow_ratio = follow_events / comparable_steps

    # Distance consistency bonus: if gap between them is stable (low variance), more suspicious
    if len(distances) > 1:
        avg_dist = sum(distances) / len(distances)
        variance = sum((d - avg_dist) ** 2 for d in distances) / len(distances)
        std_dev = math.sqrt(variance)
        # Normalize: tight following (low std_dev relative to avg) boosts confidence
        consistency_bonus = max(0, 1 - (std_dev / max(avg_dist, 1)))
    else:
        consistency_bonus = 0

    raw_confidence = (follow_ratio * 0.7) + (consistency_bonus * 0.3)
    confidence = min(100, int(raw_confidence * 100))

    # ── Decision thresholds ───────────────────────────────────────────────────
    # Spec: WARNING at 2 turns mirroring, DANGER at 3+
    is_following = follow_events >= 2 and confidence >= 50

    if follow_events >= 3 and confidence >= 65:
        reason = f"Confirmed mirroring across {follow_events} turns — high threat"
    elif follow_events >= 2:
        reason = f"Suspect matched direction and distance across {follow_events} turns"
    elif follow_events == 1:
        reason = "Single follow event detected — continuing to monitor"
    else:
        reason = "No following pattern detected"

    return FollowingResult(
        following=is_following,
        confidence=confidence,
        reason=reason
    )


# ── Speed matching check (secondary signal) ──────────────────────────────────

def check_speed_matching(
    her_speeds: list[float],
    suspect_speeds: list[float],
    tolerance: float = 0.3,   # 30% speed difference tolerance
) -> bool:
    """
    Returns True if suspect's speed changes match hers (slows when she slows, etc.)
    
    Args:
        her_speeds:     List of her speed values (m/s or km/h, just be consistent)
        suspect_speeds: List of suspect speed values
        tolerance:      How closely speeds must match as a fraction (0.3 = within 30%)
    
    Returns:
        True if speed mirroring detected across majority of samples
    """
    if len(her_speeds) < 2 or len(suspect_speeds) < 2:
        return False

    n = min(len(her_speeds), len(suspect_speeds))
    matches = 0

    for i in range(n):
        her_s = her_speeds[i]
        sus_s = suspect_speeds[i]

        # Avoid divide-by-zero; if both near zero, that's a match (both stopped)
        if her_s < 0.1 and sus_s < 0.1:
            matches += 1
            continue

        max_s = max(her_s, sus_s)
        if max_s == 0:
            continue

        diff_ratio = abs(her_s - sus_s) / max_s
        if diff_ratio <= tolerance:
            matches += 1

    return (matches / n) >= 0.6   # 60%+ of samples match = speed mirroring confirmed