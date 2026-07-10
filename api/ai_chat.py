from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os, json, urllib.request, urllib.error

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are NNIT AI Repair Assistant, an expert electronics repair technician AI by Network Nice IT (NNIT). Help diagnose faults, suggest repair steps, estimate costs, and recommend parts for smartphones, tablets, laptops, and consumer electronics. Be concise and professional."""

class ChatMessage(BaseModel):
    message: str
    device: str = ""
    fault: str = ""
    history: list = []

@router.post("/ai/chat")
def ai_chat(req: ChatMessage):
    if not GROQ_API_KEY:
        return {
            "reply": f"AI Repair Assistant ready! Add GROQ_API_KEY to Railway env vars to enable full AI.\n\nDevice: {req.device or 'unknown'}\nFault: {req.fault or req.message}\n\nGeneral steps:\n1. Power off device\n2. Check visible damage\n3. Run diagnostics\n4. Replace faulty component\n5. Test repair",
            "status": "fallback"
        }
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in req.history[-10:]:
        if isinstance(h, dict) and "role" in h and "content" in h:
            messages.append({"role": h["role"], "content": h["content"]})
    user_content = req.message
    if req.device:
        user_content = f"Device: {req.device}\nFault: {req.fault}\n\nQuestion: {req.message}"
    messages.append({"role": "user", "content": user_content})
    payload = json.dumps({"model": GROQ_MODEL, "messages": messages, "max_tokens": 1024, "temperature": 0.7}).encode("utf-8")
    req_obj = urllib.request.Request(GROQ_URL, data=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_API_KEY}"})
    try:
        with urllib.request.urlopen(req_obj, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {"reply": data["choices"][0]["message"]["content"], "status": "ok"}
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e.code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/chat/status")
def chat_status():
    return {"ai_chat": "active", "model": GROQ_MODEL, "groq_configured": bool(GROQ_API_KEY), "provider": "Groq"}
