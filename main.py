from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.device_scan import router as device_router
from api.diagnostics import router as diagnostics_router
from api.ai_diagnosis import router as ai_router
from api.processes import router as process_router
from api.storage import router as storage_router
from api.physical_disks import router as physical_router
from api.upload import router as upload_router
from api.analyze_image import router as image_router
from api.images import router as images_router
from api.image_analysis import router as image_analysis_router
from api.vision_doctor import router as vision_doctor_router
from api.video_analysis import router as video_router
from api.media_ai import router as media_router
from api.report import router as report_router
from api.smart_vision import router as smart_vision_router
from api.android_phone import router as android_phone_router
from api.repair_report import router as repair_report_router
from api.view_report import router as view_report_router
from api.pdf_report import router as pdf_report_router
from api.customers import router as customers_router
from api.tickets import router as tickets_router
from api.inventory import router as inventory_router
from api.enterprise import router as enterprise_router
from api.devices import router as devices_router
from api.staff import router as staff_router
app = FastAPI(
    title="NNIT AI Electronics Doctor Pro",
    version="1.0.0",
    description="Professional AI-powered electronics diagnostics, repair, image analysis, video analysis, and report generation platform developed by Network Nice IT (NNIT)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(device_router, prefix="/ai")
app.include_router(diagnostics_router, prefix="/ai")
app.include_router(ai_router, prefix="/ai")
app.include_router(process_router, prefix="/ai")
app.include_router(storage_router, prefix="/ai")
app.include_router(physical_router, prefix="/ai")
app.include_router(upload_router, prefix="/ai")
app.include_router(image_router, prefix="/ai")
app.include_router(images_router, prefix="/ai")
app.include_router(image_analysis_router, prefix="/ai")
app.include_router(vision_doctor_router, prefix="/ai")
app.include_router(video_router, prefix="/ai")
app.include_router(media_router, prefix="/ai")
app.include_router(report_router, prefix="/ai")
app.include_router(smart_vision_router, prefix="/ai")
app.include_router(android_phone_router, prefix="/ai")
app.include_router(repair_report_router, prefix="/ai")
app.include_router(view_report_router, prefix="/ai")
app.include_router(pdf_report_router, prefix="/ai")
app.include_router(customers_router, prefix="/ai")
app.include_router(tickets_router, prefix="/ai")
app.include_router(inventory_router, prefix="/ai")
app.include_router(enterprise_router, prefix="/ai")
app.include_router(devices_router, prefix="/ai")


@app.get("/")
def home():
    return {
        "name": "NNIT AI Electronics Doctor Pro",
        "company": "Network Nice IT (NNIT)",
        "version": "1.0.0",
        "status": "running",
        "api": "/docs",
        "features": [
            "Device Scan",
            "AI Diagnosis",
            "Storage Analysis",
            "Physical Disk Analysis",
            "Image Upload",
            "Video Upload",
            "AI Vision",
            "Media Analysis",
            "Vision Doctor",
            "Report Generator",
            "Customers",
            "Tickets",
            "Inventory",
            "Enterprise Dashboard",
            "Device Registry"
        ]
    }