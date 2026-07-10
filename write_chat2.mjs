import { writeFileSync } from "fs";
const code = `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.1-8b-instant"

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
            "reply": "Add GROQ_API_KEY to Railway env vars to enable AI.",
            "status": "fallback"
        }
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for h in req.history[-10:]:
            if isinstance(h, dict) and "role" in h and "content" in h:
                messages.append({"role": h["role"], "content": h["content"]})
        user_content = req.message
        if req.device:
            user_content = f"Device: {req.device}\\nFault: {req.fault}\\n\\nQuestion: {req.message}"
        messages.append({"role": "user", "content": user_content})
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7
        )
        return {"reply": completion.choices[0].message.content, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/chat/status")
def chat_status():
    return {"ai_chat": "active", "model": GROQ_MODEL, "groq_configured": bool(GROQ_API_KEY), "provider": "Groq"}
`;
writeFileSync("./api/ai_chat.py", code, "utf8");
console.log("ai_chat.py rewritten OK");
