from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
import os
import json

router = APIRouter()

REPORT_DIR = "reports"
PDF_DIR = "pdf_reports"

os.makedirs(PDF_DIR, exist_ok=True)


@router.get("/download-pdf/{report_name}")
def download_pdf(report_name: str):
    report_path = os.path.join(REPORT_DIR, report_name)

    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report not found")

    with open(report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    safe_name = report_name.replace(".json", ".pdf")
    pdf_path = os.path.join(PDF_DIR, safe_name)

    c = canvas.Canvas(pdf_path)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, "NNIT AI Electronics Doctor Pro")

    c.setFont("Helvetica", 11)
    y = 760

    rows = [
        ("Company", report.get("company", "")),
        ("Product", report.get("product", "")),
        ("Report ID", report.get("report_id", "")),
        ("Date", report.get("date", "")),
        ("Device", report.get("device", "")),
        ("Fault", report.get("diagnosis", {}).get("fault", "")),
        ("Confidence", str(report.get("diagnosis", {}).get("confidence", "")) + "%"),
        ("Severity", report.get("diagnosis", {}).get("severity", "")),
        ("Estimated Cost", report.get("estimated_cost", "")),
        ("Repair Time", report.get("estimated_repair_time", "")),
        ("Technician", report.get("technician", "")),
        ("Status", report.get("status", "")),
    ]

    for label, value in rows:
        c.drawString(50, y, f"{label}: {value}")
        y -= 25

    c.save()

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=safe_name
    )