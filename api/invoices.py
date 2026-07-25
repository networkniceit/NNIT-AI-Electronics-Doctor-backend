from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q_enterprise

router = APIRouter()


class Invoice(BaseModel):
    ticket_id: str = ""
    customer_name: str
    customer_email: str = ""
    customer_phone: str = ""
    device: str = ""
    fault: str = ""
    labour_cost: float = 0
    parts_cost: float = 0
    total: float = 0
    status: str = "Draft"
    due_date: str = ""
    notes: str = ""


@router.post("/invoices")
def create_invoice(inv: Invoice):
    total = inv.labour_cost + inv.parts_cost
    q_enterprise(
        "INSERT INTO invoices (ticket_id, customer_name, customer_email, customer_phone, device, fault, labour_cost, parts_cost, total, status, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (inv.ticket_id, inv.customer_name, inv.customer_email, inv.customer_phone, inv.device, inv.fault, inv.labour_cost, inv.parts_cost, total, inv.status, inv.due_date, inv.notes)
    )
    result = q_enterprise("SELECT id FROM invoices ORDER BY id DESC LIMIT 1", fetch=True)
    inv_id = result[0]["id"] if result else 0
    return {"status": "success", "invoice_id": f"INV-{str(inv_id).zfill(6)}"}


@router.get("/invoices")
def list_invoices():
    rows = q_enterprise("SELECT * FROM invoices ORDER BY id DESC", fetch=True) or []
    for r in rows:
        r["id"] = f"INV-{str(r['id']).zfill(6)}"
    return rows


def _extract_id(invoice_id: str) -> str:
    return invoice_id.replace("INV-", "").lstrip("0") or "0"


@router.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: str, inv: Invoice):
    real_id = _extract_id(invoice_id)
    total = inv.labour_cost + inv.parts_cost
    result = q_enterprise("SELECT id FROM invoices WHERE id=?", (real_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found")
    q_enterprise(
        "UPDATE invoices SET ticket_id=?, customer_name=?, customer_email=?, customer_phone=?, device=?, fault=?, labour_cost=?, parts_cost=?, total=?, status=?, due_date=?, notes=? WHERE id=?",
        (inv.ticket_id, inv.customer_name, inv.customer_email, inv.customer_phone, inv.device, inv.fault, inv.labour_cost, inv.parts_cost, total, inv.status, inv.due_date, inv.notes, real_id)
    )
    return {"status": "updated", "invoice_id": invoice_id}


@router.patch("/invoices/{invoice_id}/status")
def update_invoice_status(invoice_id: str, status: str):
    real_id = _extract_id(invoice_id)
    result = q_enterprise("SELECT id FROM invoices WHERE id=?", (real_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found")
    q_enterprise("UPDATE invoices SET status=? WHERE id=?", (status, real_id))
    return {"status": "updated", "new_status": status}


@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: str):
    real_id = _extract_id(invoice_id)
    result = q_enterprise("SELECT id FROM invoices WHERE id=?", (real_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Invoice not found")
    q_enterprise("DELETE FROM invoices WHERE id=?", (real_id,))
    return {"status": "deleted", "invoice_id": invoice_id}


@router.get("/invoices/stats")
def invoice_stats():
    rows = q_enterprise("SELECT status, COUNT(*) as count, SUM(total) as total FROM invoices GROUP BY status", fetch=True) or []
    paid_result = q_enterprise("SELECT SUM(total) as total FROM invoices WHERE status='Paid'", fetch=True)
    pending_result = q_enterprise("SELECT SUM(total) as total FROM invoices WHERE status IN ('Draft','Sent')", fetch=True)
    paid = (paid_result[0]["total"] if paid_result and paid_result[0]["total"] else 0)
    pending = (pending_result[0]["total"] if pending_result and pending_result[0]["total"] else 0)
    return {
        "by_status": [{"status": r["status"], "count": r["count"], "total": r["total"]} for r in rows],
        "total_revenue": paid,
        "pending_revenue": pending,
    }