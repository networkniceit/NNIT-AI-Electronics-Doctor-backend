from fastapi import APIRouter
from datetime import datetime
import json
import os

router = APIRouter()

REPORT_DIR = "reports"
os.makedirs(REPORT_DIR, exist_ok=True)


@router.get("/repair-report/{filename}")
def repair_report(filename: str):

    report = {
        "company": "Network Nice IT (NNIT)",
        "product": "NNIT AI Electronics Doctor Pro",
        "report_id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),

        "device": "Unknown Electronics Device",
        "filename": filename,

        "diagnosis": {
            "fault": "Needs clearer image or real AI vision model",
            "confidence": 45,
            "severity": "Medium"
        },

        "recommended_parts": [],

        "estimated_repair_time": "30 Minutes",

        "estimated_cost": "€0",

        "technician": "Network Nice IT",

        "status": "Generated"
    }

    report_file = os.path.join(
        REPORT_DIR,
        f"{filename}_report.json"
    )

    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(
            report,
            f,
            indent=4
        )

    return report


@router.get("/report-history")
def report_history():

    reports = []

    for file in os.listdir(REPORT_DIR):

        if file.endswith(".json"):

            reports.append(file)

    return reports