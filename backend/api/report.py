from fastapi import APIRouter
from datetime import datetime
import os
import json

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT_DIR = os.path.join(BASE_DIR, "reports")

os.makedirs(REPORT_DIR, exist_ok=True)

@router.post("/generate-report")
def generate_report(filename: str, device: str = "Unknown", fault: str = "Unknown"):
    report = {
        "app": "AI Electronics Doctor Pro",
        "date": str(datetime.now()),
        "filename": filename,
        "device": device,
        "fault": fault,
        "status": "report generated",
        "recommendation": "Connect real AI vision model for deeper inspection"
    }

    safe_name = filename.replace(" ", "_").replace(".", "_")
    path = os.path.join(REPORT_DIR, f"{safe_name}_report.json")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return {
        "status": "success",
        "report": report,
        "saved_to": path
    }