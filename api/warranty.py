from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q_enterprise

router = APIRouter()


class Warranty(BaseModel):
    ticket_id: str = ""
    customer_name: str
    device: str
    serial_number: str = ""
    warranty_type: str = "Repair Warranty"
    start_date: str = ""
    end_date: str = ""
    notes: str = ""


@router.post("/warranty")
def create_warranty(w: Warranty):
    q_enterprise(
        "INSERT INTO warranties (ticket_id, customer_name, device, serial_number, warranty_type, start_date, end_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (w.ticket_id, w.customer_name, w.device, w.serial_number, w.warranty_type, w.start_date, w.end_date, w.notes)
    )
    return {"status": "success"}


@router.get("/warranty")
def list_warranties():
    rows = q_enterprise("SELECT * FROM warranties ORDER BY id DESC", fetch=True)
    return rows or []


@router.delete("/warranty/{wid}")
def delete_warranty(wid: str):
    result = q_enterprise("SELECT id FROM warranties WHERE id=?", (wid,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Warranty not found")
    q_enterprise("DELETE FROM warranties WHERE id=?", (wid,))
    return {"status": "deleted"}