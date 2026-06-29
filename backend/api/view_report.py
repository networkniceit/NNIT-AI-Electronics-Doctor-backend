from fastapi import APIRouter, HTTPException
import os
import json

router = APIRouter()

REPORT_DIR = "reports"

@router.get("/view-report/{filename}")
def view_report(filename: str):

    path = os.path.join(REPORT_DIR, filename)

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Report not found")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)