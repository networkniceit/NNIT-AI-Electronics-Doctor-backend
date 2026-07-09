from fastapi import APIRouter
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
FRAMES_DIR = os.path.join(BASE_DIR, "frames")

os.makedirs(FRAMES_DIR, exist_ok=True)


def detect_from_name(filename: str):
    name = filename.lower()

    if any(x in name for x in ["ssd", "hdd", "drive", "disk"]):
        return "Storage Device", ["USB/SATA connection fault", "Bad sectors", "Drive health issue"], ["SSD/HDD", "USB SATA Enclosure"]

    if any(x in name for x in ["phone", "iphone", "samsung"]):
        return "Phone", ["Battery fault", "Charging port issue", "Screen damage"], ["Battery", "Charging Port", "Display"]

    if any(x in name for x in ["laptop", "motherboard", "board"]):
        return "Laptop / Motherboard", ["Power circuit fault", "RAM/SSD issue", "Visible board damage"], ["RAM", "SSD", "Power IC"]

    if any(x in name for x in ["tv", "power"]):
        return "TV / Power Board", ["Power supply issue", "Capacitor failure"], ["Capacitors", "Power board"]

    return "Unknown Electronics Device", ["Needs clearer image or real vision model"], []


def image_quality(path: str):
    img = cv2.imread(path)

    if img is None:
        return {
            "readable": False,
            "brightness": 0,
            "sharpness": 0,
            "warning": "Image cannot be read"
        }

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = round(float(gray.mean()), 2)
    sharpness = round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 2)

    warning = "Good"

    if brightness < 50:
        warning = "Image too dark"
    elif brightness > 220:
        warning = "Image too bright"
    elif sharpness < 80:
        warning = "Image may be blurry"

    return {
        "readable": True,
        "brightness": brightness,
        "sharpness": sharpness,
        "warning": warning
    }


@router.get("/smart-analyze/{filename}")
def smart_analyze(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(path):
        return {
            "status": "error",
            "message": "File not found"
        }

    ext = os.path.splitext(filename)[1].lower()
    device, faults, parts = detect_from_name(filename)

    if ext in [".jpg", ".jpeg", ".png", ".webp"]:
        quality = image_quality(path)

        confidence = 70 if device != "Unknown Electronics Device" else 45

        if quality["warning"] != "Good":
            confidence -= 15

        return {
            "status": "success",
            "type": "image",
            "filename": filename,
            "device": device,
            "confidence": max(confidence, 20),
            "quality": quality,
            "faults": faults,
            "recommended_parts": parts,
            "repair_steps": [
                "Inspect device physically",
                "Check connectors and visible damage",
                "Run hardware diagnostic scan",
                "Confirm fault before replacing parts"
            ]
        }

    if ext in [".mp4", ".mov", ".avi", ".mkv"]:
        video = cv2.VideoCapture(path)

        frame_count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = video.get(cv2.CAP_PROP_FPS)
        duration = round(frame_count / fps, 2) if fps else 0

        saved_frames = []
        step = max(frame_count // 5, 1)

        for i in range(5):
            video.set(cv2.CAP_PROP_POS_FRAMES, i * step)
            ok, frame = video.read()

            if not ok:
                continue

            frame_name = f"{os.path.splitext(filename)[0]}_smart_frame_{i}.jpg"
            frame_path = os.path.join(FRAMES_DIR, frame_name)

            cv2.imwrite(frame_path, frame)
            saved_frames.append(frame_path)

        video.release()

        return {
            "status": "success",
            "type": "video",
            "filename": filename,
            "duration_seconds": duration,
            "frame_count": frame_count,
            "frames_extracted": saved_frames,
            "device": device,
            "confidence": 65 if device != "Unknown Electronics Device" else 40,
            "faults": faults,
            "recommended_parts": parts,
            "repair_steps": [
                "Review extracted frames",
                "Identify device clearly",
                "Check visible faults",
                "Run deeper AI vision model later"
            ]
        }

    return {
        "status": "error",
        "message": "Unsupported file type"
    }
