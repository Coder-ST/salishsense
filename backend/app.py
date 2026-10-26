import csv
import io
import json
import os
import re

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openpyxl import load_workbook

from scoring import THRESHOLDS, get_ranges, score_waterbody, tier_ranges

load_dotenv()

app = Flask(__name__)
CORS(app)

ALIASES = {
    "total_phosphorus_ug_L": ["tp", "total phosphorus", "total_phosphorus"],
    "total_nitrogen_ug_L": ["tn", "total nitrogen", "total_nitrogen"],
    "chlorophyll_a_ug_L": ["chlor-a", "chlorophyll-a", "chlorophyll a", "chlorophyll_a", "chl-a", "chlorophyll"],
    "secchi_depth_m": ["secchi", "secchi depth", "secchi_depth"],
    "water_temperature_C": ["temp", "temperature", "water temperature", "water_temperature"],
    "dissolved_oxygen_mg_L": ["do", "dissolved oxygen", "dissolved_oxygen"],
    "pH": ["ph"],
}

LOOKUP = {alias: metric for metric, names in ALIASES.items() for alias in names}
LOOKUP.update({metric.lower(): metric for metric in THRESHOLDS})


def metric_for(header):
    name = re.sub(r"\(.*?\)", "", str(header)).strip().lower()
    return LOOKUP.get(name) or LOOKUP.get(str(header).strip().lower())


def to_number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def read_rows(upload):
    """Turn the file into a list of {header: value} rows."""
    name = upload.filename.lower()
    data = upload.read()

    if name.endswith(".xlsx"):
        rows = list(load_workbook(io.BytesIO(data), read_only=True, data_only=True).active.values)
        header = [str(h) if h is not None else "" for h in rows[0]]
        return [dict(zip(header, r)) for r in rows[1:]]

    if name.endswith(".json"):
        parsed = json.loads(data)
        if isinstance(parsed, dict):  # columns turned into rows
            count = max(len(v) for v in parsed.values())
            return [{k: v[i] if i < len(v) else None for k, v in parsed.items()} for i in range(count)]
        return parsed

    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = data.decode("latin-1")
    lines = text.splitlines()
    # header is the first line with a column we know, so lines above it get skipped
    start = next(i for i, line in enumerate(lines) if any(metric_for(c) for c in next(csv.reader([line]))))
    return list(csv.DictReader(lines[start:]))


# names and units shown for the key indicators
INDICATOR_INFO = {
    "total_phosphorus_ug_L": ("Phosphorus", "\u00b5g/L"),
    "secchi_depth_m": ("Secchi depth", "m"),
    "dissolved_oxygen_mg_L": ("Dissolved oxygen", "mg/L"),
    "chlorophyll_a_ug_L": ("Chlorophyll-a", "\u00b5g/L"),
}


def main_metrics(waterbody):
    """The three main readings. Rivers and streams use dissolved oxygen since Secchi isn't scored for them."""
    third = "secchi_depth_m" if waterbody in ("lake", "pond") else "dissolved_oxygen_mg_L"
    return ["total_phosphorus_ug_L", third, "chlorophyll_a_ug_L"]


def build_indicators(waterbody, result):
    cards = []
    for metric in main_metrics(waterbody):
        reading = result["metrics"].get(metric)
        if reading:
            label, unit = INDICATOR_INFO[metric]
            cards.append({"label": label, "value": f"{round(reading['value'], 1):g} {unit}", "flag": reading["flag"]})
    return cards


REPORT_PROMPT = """You write short water quality reports for community members.
You are given a waterbody, its overall score (1 to 10, higher is healthier), its readings, and the threshold
ranges used to judge each reading (from best to worst: ideal, good, fair, poor, dangerous). The readings are split into "main_metrics",
the three most important ones, and "additional_metrics", any other readings that were provided (this can be empty).

Use only the numbers provided and do not invent facts about the place. Say "may" or "often" when a cause is
likely rather than certain. Write in plain, friendly language for non-scientists, in full paragraphs with no
lists, bullets or headings. Do not use em dashes. Name readings in plain words (like "phosphorus" or
"water clarity"), never with underscores.

Reply with JSON only, with three paragraphs as plain strings:
{
  "summary": "A short paragraph on the overall health of the waterbody and the main issue.",
  "breakdown": "A paragraph of about 120 words (never more than 130) that analyzes the potential causes of the problems found. First explain what the three main readings show and how they are likely connected. Then go through each additional reading one by one, saying briefly what it shows and how it may relate to the main readings. If there are no additional readings, just explain the three main readings, and do not mention that others are missing. Do not describe the structure of your answer. It should be more detailed than the summary.",
  "improvements": "A paragraph of about 70 words (never more than 80) on the most helpful steps to fix the problems found, covering what individuals, the community, and the city can do. Be specific about what to do and which reading it helps. Favor cost effective steps that most cities can afford, from low cost to moderately priced, such as changing yard care habits, planting shoreline buffers, or fixing septic systems. You may mention at most one expensive step, such as a stormwater treatment project, and only if it would clearly help, and say that it costs more."
}"""


def build_report(name, waterbody, result):
    """Asks Groq for the report. Returns (report, error)."""
    key, model = os.getenv("GROQ_API_KEY"), os.getenv("GROQ_MODEL")
    if not key or not model:
        return None, "The AI report is not set up on the server."

    ranges = {metric: tier_ranges(get_ranges(metric, waterbody)) for metric in result["metrics"]}
    main = main_metrics(waterbody)
    facts = {"name": name or "this waterbody", "type": waterbody, "score": result["score"],
             "main_metrics": {m: result["metrics"][m] for m in main if m in result["metrics"]},
             "additional_metrics": {m: v for m, v in result["metrics"].items() if m not in main},
             "threshold_ranges": ranges}

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={"model": model, "temperature": 0.3, "reasoning_effort": "low",
                  "response_format": {"type": "json_object"},
                  "messages": [{"role": "system", "content": REPORT_PROMPT},
                               {"role": "user", "content": json.dumps(facts)}]},
            timeout=60,
        )
        response.raise_for_status()
        return json.loads(response.json()["choices"][0]["message"]["content"]), None
    except Exception:
        return None, "Could not generate the AI report right now."


@app.post("/api/analyze")
def analyze():
    upload = request.files.get("file")
    waterbody = request.form.get("type", "").lower()
    if upload is None:
        return jsonify(error="No file uploaded."), 400
    if waterbody not in ("lake", "pond", "river", "stream"):
        return jsonify(error="Choose a waterbody type: lake, pond, river or stream."), 400

    try:
        rows = read_rows(upload)
    except Exception:
        return jsonify(error="Could not read that file."), 400

    matched = {}
    for header in rows[0] if rows else []:
        metric = metric_for(header)
        if metric:
            matched[header] = metric
    readings = [{metric: to_number(row.get(h)) for h, metric in matched.items()} for row in rows]

    try:
        result = score_waterbody(waterbody, readings)
    except ValueError as e:
        return jsonify(error=str(e)), 400

    name = request.form.get("name", "")
    report, report_error = build_report(name, waterbody, result)
    return jsonify(name=name, type=waterbody, entries=len(rows), columns_used=matched,
                   indicators=build_indicators(waterbody, result),
                   report=report, report_error=report_error, **result)


if __name__ == "__main__":
    app.run(port=5001, debug=True)
