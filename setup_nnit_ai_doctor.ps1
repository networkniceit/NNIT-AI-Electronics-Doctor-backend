Write-Host "Building NNIT AI Electronics Doctor Pro..."

$root = "C:\NNIT AI-Electronics-Doctor"
$backend = "$root\backend"
$frontend = "$root\frontend"

mkdir $root -Force
mkdir $backend -Force
mkdir "$backend\api" -Force
mkdir "$backend\scanners" -Force
mkdir "$backend\repair_tools" -Force
mkdir "$backend\uploads" -Force
mkdir $frontend -Force

@"
fastapi
uvicorn
python-multipart
psutil
requests
sqlalchemy
pydantic
websockets
"@ | Out-File "$backend\requirements.txt" -Encoding utf8

@"
from fastapi import FastAPI
from api.device_scan import router as device_router
from api.diagnostics import router as diagnostics_router
from api.ai_diagnosis import router as ai_router
from api.processes import router as process_router
from api.storage import router as storage_router
from api.physical_disks import router as physical_router
from api.upload import router as upload_router
from api.images import router as images_router
from api.image_analysis import router as image_analysis_router

app = FastAPI(title="AI Electronics Doctor Pro")

app.include_router(device_router, prefix="/ai")
app.include_router(diagnostics_router, prefix="/ai")
app.include_router(ai_router, prefix="/ai")
app.include_router(process_router, prefix="/ai")
app.include_router(storage_router, prefix="/ai")
app.include_router(physical_router, prefix="/ai")
app.include_router(upload_router, prefix="/ai")
app.include_router(images_router, prefix="/ai")
app.include_router(image_analysis_router, prefix="/ai")

@app.get("/")
def home():
    return {
        "name": "AI Electronics Doctor Pro",
        "status": "running",
        "version": "1.0"
    }
"@ | Out-File "$backend\main.py" -Encoding utf8

@"
import platform
import psutil

def scan_system():
    battery = psutil.sensors_battery()

    return {
        "computer": platform.node(),
        "system": platform.system(),
        "processor": platform.processor(),
        "ram_gb": round(psutil.virtual_memory().total / (1024**3), 2),
        "battery": battery.percent if battery else "Desktop"
    }
"@ | Out-File "$backend\scanners\system_scan.py" -Encoding utf8

@"
from fastapi import APIRouter
from scanners.system_scan import scan_system

router = APIRouter()

@router.get("/device-scan")
def device_scan():
    return scan_system()
"@ | Out-File "$backend\api\device_scan.py" -Encoding utf8

@"
import psutil

def diagnose_system():
    problems = []

    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()

    if cpu > 90:
        problems.append("High CPU usage detected")

    if memory.percent > 85:
        problems.append("High RAM usage detected")

    if not problems:
        problems.append("No major system faults detected")

    return {
        "cpu_usage": cpu,
        "ram_usage": memory.percent,
        "faults": problems,
        "recommendation": "Run deeper AI diagnosis if needed"
    }
"@ | Out-File "$backend\repair_tools\diagnostics.py" -Encoding utf8

@"
from fastapi import APIRouter
from repair_tools.diagnostics import diagnose_system

router = APIRouter()

@router.get("/diagnostics")
def diagnostics():
    return diagnose_system()
"@ | Out-File "$backend\api\diagnostics.py" -Encoding utf8

@"
from fastapi import APIRouter
from repair_tools.diagnostics import diagnose_system

router = APIRouter()

@router.get("/ai-diagnosis")
def ai_diagnosis():
    result = diagnose_system()
    recommendations = []

    if result["ram_usage"] > 85:
        recommendations += [
            "Close unnecessary programs",
            "Check startup applications",
            "Restart computer",
            "Investigate memory-heavy processes"
        ]

    if result["cpu_usage"] > 90:
        recommendations += [
            "Check background tasks",
            "Run malware scan",
            "Review CPU intensive apps"
        ]

    if not recommendations:
        recommendations.append("System appears healthy")

    return {
        "analysis": result,
        "recommendations": recommendations
    }
"@ | Out-File "$backend\api\ai_diagnosis.py" -Encoding utf8

@"
from fastapi import APIRouter
import psutil
import time

router = APIRouter()

@router.get("/processes")
def processes():
    for p in psutil.process_iter():
        try:
            p.cpu_percent()
        except:
            pass

    time.sleep(1)

    items = []

    for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
        try:
            items.append(proc.info)
        except:
            pass

    items.sort(key=lambda x: x["cpu_percent"], reverse=True)

    return items[:20]
"@ | Out-File "$backend\api\processes.py" -Encoding utf8

@"
import psutil

def scan_drives():
    drives = []

    for p in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(p.mountpoint)

            drives.append({
                "drive": p.device,
                "mount": p.mountpoint,
                "filesystem": p.fstype,
                "total_gb": round(usage.total / (1024**3), 2),
                "used_gb": round(usage.used / (1024**3), 2),
                "free_gb": round(usage.free / (1024**3), 2)
            })
        except:
            pass

    return drives
"@ | Out-File "$backend\scanners\storage_scan.py" -Encoding utf8

@"
from fastapi import APIRouter
from scanners.storage_scan import scan_drives

router = APIRouter()

@router.get("/storage")
def storage():
    return scan_drives()
"@ | Out-File "$backend\api\storage.py" -Encoding utf8

@"
import subprocess

def physical_disks():
    try:
        result = subprocess.check_output(
            "wmic diskdrive get model,size,status",
            shell=True
        )

        return {
            "disks": result.decode(errors="ignore")
        }

    except Exception as e:
        return {
            "error": str(e)
        }
"@ | Out-File "$backend\scanners\physical_disks.py" -Encoding utf8

@"
from fastapi import APIRouter
from scanners.physical_disks import physical_disks

router = APIRouter()

@router.get("/physical-disks")
def disks():
    return physical_disks()
"@ | Out-File "$backend\api\physical_disks.py" -Encoding utf8

@"
from fastapi import APIRouter, UploadFile, File
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    filepath = os.path.join(UPLOAD_DIR, file.filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    return {
        "status": "success",
        "filename": file.filename,
        "saved_to": filepath
    }
"@ | Out-File "$backend\api\upload.py" -Encoding utf8

@"
from fastapi import APIRouter
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

@router.get("/images")
def list_images():
    if not os.path.exists(UPLOAD_DIR):
        return []

    return [
        {
            "filename": name,
            "path": os.path.join(UPLOAD_DIR, name)
        }
        for name in os.listdir(UPLOAD_DIR)
    ]
"@ | Out-File "$backend\api\images.py" -Encoding utf8

@"
from fastapi import APIRouter
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

@router.get("/analyze-uploaded-image/{filename}")
def analyze_uploaded_image(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(path):
        return {
            "status": "error",
            "message": "Image not found"
        }

    return {
        "status": "success",
        "filename": filename,
        "analysis": {
            "device": "Unknown electronics image",
            "condition": "Image received successfully",
            "fault_detected": "AI vision upgrade ready",
            "recommendation": "Connect real vision model next"
        }
    }
"@ | Out-File "$backend\api\image_analysis.py" -Encoding utf8

@"
cd C:\NNIT AI-Electronics-Doctor\backend
python -m uvicorn main:app --reload
"@ | Out-File "$root\start-backend.ps1" -Encoding utf8

cd $backend
python -m pip install -r requirements.txt

Write-Host ""
Write-Host "DONE."
Write-Host "Run this:"
Write-Host "cd C:\NNIT AI-Electronics-Doctor"
Write-Host ".\start-backend.ps1"