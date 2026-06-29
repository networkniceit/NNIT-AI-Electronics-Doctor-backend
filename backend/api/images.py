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