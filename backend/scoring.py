import json
from pathlib import Path

import numpy as np

# skip keys that start with "_", they are just notes
THRESHOLDS = {m: v for m, v in json.loads((Path(__file__).parent / "thresholds.json").read_text()).items()
              if not m.startswith("_")}

REQUIRED = ["total_phosphorus_ug_L", "chlorophyll_a_ug_L", "secchi_depth_m"]

GROUP = {"lake": "lake_pond", "pond": "lake_pond", "river": "stream_river", "stream": "stream_river"}

# some metrics have different ranges for each waterbody, checked by waterbody first and then by group
VARIANT = {
    "chlorophyll_a_ug_L": {"stream_river": "stream_river_seston"},
    "water_temperature_C": {"lake": "lake", "pond": "pond_warmwater", "stream_river": "stream_river_salmonid"},
    "dissolved_oxygen_mg_L": {"lake": "coldwater", "pond": "warmwater", "stream_river": "coldwater"},
}

# best to worst, each one covers part of the 0 to 1 scale
TIERS = ["ideal", "good", "fair", "poor", "dangerous"]
QUALITY = {"ideal": (1.0, 0.85), "good": (0.85, 0.65), "fair": (0.65, 0.4), "poor": (0.4, 0.15), "dangerous": (0.15, 0.0)}


def get_ranges(metric, waterbody):
    """Get the ranges for a metric. Returns None if it isn't scored (like Secchi for streams)."""
    entry = THRESHOLDS[metric]
    picks = VARIANT.get(metric, {})
    key = picks.get(waterbody) or picks.get(GROUP[waterbody])
    if key is None:
        key = "all" if "all" in entry else GROUP[waterbody]
    return entry.get(key)


def tier_ranges(r):
    """Only the tier bands, no notes or sources."""
    return {k: v for k, v in r.items() if k.split("_")[0] in TIERS and isinstance(v, list)}


def bands(r):
    """Bands as [tier, low, high]. An open end gets the same width as the next tier in."""
    found = [[k.split("_")[0], *v] for k, v in tier_ranges(r).items()]

    def width(tier):
        band = next(b for b in found if b[0] == tier)
        return band[2] - band[1]

    for b in found:
        if b[2] is None:
            b[2] = b[1] + width(TIERS[TIERS.index(b[0]) + (1 if b[0] == "ideal" else -1)])
        if b[1] is None:
            b[1] = b[2] - width(TIERS[TIERS.index(b[0]) + (1 if b[0] == "ideal" else -1)])
    return found


def grade(x, r):
    """Returns (tier, quality). Quality is 1 at the best end of ideal and 0 at the worst end of dangerous.
    frac is how far through the tier the reading is, 0 at the best end and 1 at the worst."""
    all_bands = bands(r)
    x = min(max(x, min(b[1] for b in all_bands)), max(b[2] for b in all_bands))
    ideal = next(b for b in all_bands if b[0] == "ideal")

    # if it lands on a boundary, use the better tier
    tier, low, high = next(b for t in TIERS for b in all_bands if b[0] == t and b[1] <= x <= b[2])
    best, worst = QUALITY[tier]

    if tier == "ideal":
        above = any(b[0] == "good" and b[1] >= high for b in all_bands)
        below = any(b[0] == "good" and b[2] <= low for b in all_bands)
        if above and below:  # like pH, the middle is best
            frac = abs(x - (low + high) / 2) / ((high - low) / 2)
        else:
            frac = (x - low) / (high - low) if above else (high - x) / (high - low)
    else:
        # best end is the one closer to ideal
        frac = (high - x) / (high - low) if (low + high) / 2 < (ideal[1] + ideal[2]) / 2 else (x - low) / (high - low)

    return tier, best - frac * (best - worst)


def average(values):
    """A single number stays the same, a list gets averaged without the blanks."""
    if not isinstance(values, (list, tuple)):
        return values
    nums = [v for v in values if v is not None and not np.isnan(v)]
    return float(np.mean(nums)) if nums else None


def score_waterbody(waterbody, readings):
    """readings is a list of rows or a dict like {"total_phosphorus_ug_L": 14, ...}.
    Each value is a number or a list, and lists get averaged first."""
    waterbody = waterbody.lower()

    if isinstance(readings, list):  # rows from the file
        readings = {m: [row.get(m) for row in readings] for m in THRESHOLDS}
    readings = {m: average(v) for m, v in readings.items()}

    missing = [m for m in REQUIRED if get_ranges(m, waterbody) and readings.get(m) is None]
    if missing:
        raise ValueError(f"Missing required readings: {', '.join(missing)}")

    results = {}
    for metric in THRESHOLDS:
        value, ranges = readings.get(metric), get_ranges(metric, waterbody)
        if value is None or ranges is None:
            continue
        tier, quality = grade(value, ranges)
        results[metric] = {"value": value, "distance": round(1 - quality, 3), "flag": tier}

    distances = np.array([m["distance"] for m in results.values()])

    overall = np.linalg.norm(distances) / np.sqrt(len(distances))

    return {"score": max(1, round(10 * (1 - overall), 1)), "metrics": results}
