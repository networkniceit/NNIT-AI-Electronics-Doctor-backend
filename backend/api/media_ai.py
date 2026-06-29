from fastapi import APIRouter
import os
import cv2

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
FRAMES_DIR = os.path.join(BASE_DIR, "frames")

os.makedirs(FRAMES_DIR, exist_ok=True)


def basic_ai_analysis(filename):
    name = filename.lower()

    if any(x in name for x in ["ssd", "hdd", "drive", "disk"]):
        return {
            "device": "Storage device",
            "possible_fault": "Check USB/SATA connection, SMART health, bad sectors",
            "parts": ["USB SATA enclosure", "SSD/HDD replacement"],
            "confidence": 75
        }

    if "phone" in name:
        return {
            "device": "Phone",
            "possible_fault": "Battery, screen, charging port, or motherboard fault",
            "parts": ["Battery", "Charging port", "Display"],
            "confidence": 70
        }

    if any(x in name for x in ["laptop", "motherboard", "board"]):
        return {
            "device": "Laptop / motherboard",
            "possible_fault": "RAM, SSD, power circuit, or visible board damage",
            "parts": ["RAM", "SSD", "Power adapter", "Board components"],
            "confidence": 70
        }

    return {
        "device": "Unknown electronics device",
        "possible_fault": "Upload clearer file name or add real AI vision model next",
        "parts": [],
        "confidence": 40
    }


@router.get("/analyze-media/{filename}")
def analyze_media(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(path):
        return {
            "status": "error",
            "message": "File not found"
        }

    ext = os.path.splitext(filename)[1].lower()

    image_ext = [".jpg", ".jpeg", ".png", ".webp"]
    video_ext = [".mp4", ".mov", ".avi", ".mkv"]

    if ext in image_ext:
        analysis = basic_ai_analysis(filename)

        return {
            "status": "success",
            "type": "image",
            "filename": filename,
            "analysis": analysis
        }

    if ext in video_ext:
        video = cv2.VideoCapture(path)

        frame_count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = video.get(cv2.CAP_PROP_FPS)
        duration = round(frame_count / fps, 2) if fps else 0

        saved_frames = []
        step = max(frame_count // 5, 1)

        current = 0
        saved = 0

        while saved < 5 and video.isOpened():
            video.set(cv2.CAP_PROP_POS_FRAMES, current)
            ok, frame = video.read()

            if not ok:
                break

            frame_name = f"{os.path.splitext(filename)[0]}_frame_{saved}.jpg"
            frame_path = os.path.join(FRAMES_DIR, frame_name)

            cv2.imwrite(frame_path, frame)

            saved_frames.append(frame_path)

            current += step
            saved += 1

        video.release()

        analysis = basic_ai_analysis(filename)

        return {
            "status": "success",
            "type": "video",
            "filename": filename,
            "duration_seconds": duration,
            "frame_count": frame_count,
            "frames_extracted": saved_frames,
            "analysis": analysis
        }

    return {
        "status": "error",
        "message": "Unsupported file type"
    }