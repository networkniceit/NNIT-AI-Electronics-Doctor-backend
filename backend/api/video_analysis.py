from fastapi import APIRouter
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

@router.get("/analyze-video/{filename}")
def analyze_video(filename: str):

    path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(path):
        return {
            "status": "error",
            "message": "Video not found"
        }

    extension = os.path.splitext(filename)[1].lower()

    return {
        "status": "success",
        "filename": filename,
        "video_path": path,
        "analysis": {
            "extension": extension,
            "video_detected": True,
            "frames_to_analyze": 30,
            "ai_status": "Ready",
            "next_step": "Extract frames and analyze electronics in each frame"
        }
    }