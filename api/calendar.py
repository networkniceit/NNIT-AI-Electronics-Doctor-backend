from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q_enterprise

router = APIRouter()

class CalendarEvent(BaseModel):
    title: str
    customer_name: str = ""
    device: str = ""
    event_date: str
    event_time: str = ""
    event_type: str = "Appointment"
    notes: str = ""

@router.get("/calendar")
def list_events():
    result = q_enterprise("SELECT * FROM calendar_events ORDER BY event_date, event_time", fetch=True)
    return result or []

@router.post("/calendar")
def create_event(event: CalendarEvent):
    q_enterprise(
        "INSERT INTO calendar_events (title, customer_name, device, event_date, event_time, event_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (event.title, event.customer_name, event.device, event.event_date, event.event_time, event.event_type, event.notes)
    )
    return {"success": True, "message": "Event created successfully"}

@router.delete("/calendar/{event_id}")
def delete_event(event_id: str):
    result = q_enterprise("SELECT id FROM calendar_events WHERE id=?", (event_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    q_enterprise("DELETE FROM calendar_events WHERE id=?", (event_id,))
    return {"success": True, "message": "Event deleted successfully"}