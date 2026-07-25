from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q_enterprise

router = APIRouter()


class HistoryEvent(BaseModel):
    customer_id: str = ""
    customer_name: str
    device: str
    event_type: str = "Repair"
    description: str
    cost: float = 0
    technician: str = ""
    ticket_id: str = ""


@router.post("/device-history")
def add_history(event: HistoryEvent):
    q_enterprise(
        "INSERT INTO device_history (customer_id, customer_name, device, event_type, description, cost, technician, ticket_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (event.customer_id, event.customer_name, event.device, event.event_type, event.description, event.cost, event.technician, event.ticket_id)
    )
    return {"status": "success"}


@router.get("/device-history")
def list_history(customer_name: str = "", device: str = ""):
    if customer_name:
        rows = q_enterprise("SELECT * FROM device_history WHERE customer_name LIKE ? ORDER BY id DESC", (f"%{customer_name}%",), fetch=True)
    elif device:
        rows = q_enterprise("SELECT * FROM device_history WHERE device LIKE ? ORDER BY id DESC", (f"%{device}%",), fetch=True)
    else:
        rows = q_enterprise("SELECT * FROM device_history ORDER BY id DESC LIMIT 100", fetch=True)
    return rows or []


@router.delete("/device-history/{hid}")
def delete_history(hid: str):
    result = q_enterprise("SELECT id FROM device_history WHERE id=?", (hid,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="History entry not found")
    q_enterprise("DELETE FROM device_history WHERE id=?", (hid,))
    return {"status": "deleted"}