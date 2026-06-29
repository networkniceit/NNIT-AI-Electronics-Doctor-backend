from fastapi import APIRouter, UploadFile, File
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    filepath = os.path.join(UPLOAD_DIR, file.filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    file_type = "unknown"

    if file.content_type:
        if file.content_type.startswith("image/"):
            file_type = "image"
        elif file.content_type.startswith("video/"):
            file_type = "video"

    return {
        "status": "success",
        "filename": file.filename,
        "content_type": file.content_type,
        "file_type": file_type,
        "saved_to": filepath
    }

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    return await upload_file(file)