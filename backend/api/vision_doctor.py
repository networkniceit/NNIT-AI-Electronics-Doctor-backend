from fastapi import APIRouter
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

@router.get("/vision-doctor/{filename}")
def vision_doctor(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(path):
        return {
            "status": "error",
            "message": "Image not found"
        }

    name = filename.lower()

    detected = "unknown electronic device"
    faults = []
    parts = []
    repair_steps = []

    if "ssd" in name or "drive" in name or "hdd" in name:
        detected = "storage device"
        faults.append("Check SATA/USB connection and disk health")
        parts.append("USB SATA enclosure or replacement SSD/HDD")
        repair_steps.append("Run storage and physical disk scan")

    elif "phone" in name:
        detected = "phone"
        faults.append("Check battery, charging port, screen, and board")
        parts.append("Battery, charging port, display")
        repair_steps.append("Inspect charging port and test battery")

    elif "laptop" in name or "motherboard" in name:
        detected = "laptop or motherboard"
        faults.append("Check RAM, SSD, power ICs, and visible board damage")
        parts.append("RAM, SSD, power adapter, motherboard components")
        repair_steps.append("Run hardware scan and inspect board carefully")

    else:
        faults.append("No specific device identified from filename")
        repair_steps.append("Upload a clearer image and include device name in filename")

    return {
        "status": "success",
        "filename": filename,
        "image_path": path,
        "analysis": {
            "detected_device": detected,
            "possible_faults": faults,
            "recommended_parts": parts,
            "repair_steps": repair_steps,
            "confidence": 60
        }
    }