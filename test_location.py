from location import check_following

her_path = [
    {"lat": 12.9716, "lng": 77.5946},
    {"lat": 12.9720, "lng": 77.5950},
    {"lat": 12.9725, "lng": 77.5955},
]
suspect_path = [
    {"lat": 12.9714, "lng": 77.5944},
    {"lat": 12.9718, "lng": 77.5948},
    {"lat": 12.9723, "lng": 77.5953},
]

result = check_following(her_path, suspect_path)
print(result)