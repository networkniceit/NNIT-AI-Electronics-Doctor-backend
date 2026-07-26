from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from services.db import q_enterprise, log_action

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class Ticket(BaseModel):
    customer: str = ""
    device_brand: str = ""
    device_model: str = ""
    fault_description: str
    priority: str = "Medium"
    status: str = "Open"
    estimated_cost: str = ""
    technician_notes: str = ""


@router.post("/tickets")
@limiter.limit("30/minute")
def create_ticket(request: Request, ticket: Ticket):
    q_enterprise(
        "INSERT INTO tickets (customer, device_brand, device_model, fault_description, priority, status, estimated_cost, technician_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (ticket.customer, ticket.device_brand, ticket.device_model, ticket.fault_description, ticket.priority, ticket.status, ticket.estimated_cost, ticket.technician_notes)
    )
    log_action("", "create_ticket", ticket.customer, request.client.host if request.client else "")
    return {"status": "success"}


@router.get("/tickets")
def list_tickets():
    rows = q_enterprise("SELECT * FROM tickets ORDER BY id DESC", fetch=True)
    return rows or []


@router.patch("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: str, status: str):
    result = q_enterprise("SELECT id FROM tickets WHERE id=?", (ticket_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Ticket not found")
    q_enterprise("UPDATE tickets SET status=? WHERE id=?", (status, ticket_id))
    return {"status": "success", "ticket_id": ticket_id, "new_status": status}


@router.delete("/tickets/{ticket_id}")
def delete_ticket(ticket_id: str, request: Request):
    result = q_enterprise("SELECT id FROM tickets WHERE id=?", (ticket_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Ticket not found")
    q_enterprise("DELETE FROM tickets WHERE id=?", (ticket_id,))
    log_action("", "delete_ticket", str(ticket_id), request.client.host if request.client else "")
    return {"status": "deleted", "ticket_id": ticket_id}