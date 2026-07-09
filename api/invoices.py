from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import sqlite3

router = APIRouter()
DB = "nnit_doctor.db"

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

def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT DEFAULT "",
            customer_name TEXT,
            customer_email TEXT DEFAULT "",
            customer_phone TEXT DEFAULT "",
            device TEXT DEFAULT "",
            fault TEXT DEFAULT "",
            labour_cost REAL DEFAULT 0,
            parts_cost REAL DEFAULT 0,
            total REAL DEFAULT 0,
            status TEXT DEFAULT "Draft",
            due_date TEXT DEFAULT "",
            notes TEXT DEFAULT "",
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    con.commit()
    con.close()

init_db()

@router.post("/invoices")
def create_invoice(inv: Invoice):
    total = inv.labour_cost + inv.parts_cost
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
        INSERT INTO invoices (ticket_id, customer_name, customer_email, customer_phone,
        device, fault, labour_cost, parts_cost, total, status, due_date, notes, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (inv.ticket_id, inv.customer_name, inv.customer_email, inv.customer_phone,
          inv.device, inv.fault, inv.labour_cost, inv.parts_cost, total,
          inv.status, inv.due_date, inv.notes, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    con.commit()
    inv_id = cur.lastrowid
    con.close()
    return {"status": "success", "invoice_id": f"INV-{str(inv_id).zfill(6)}"}

@router.get("/invoices")
def list_invoices():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT * FROM invoices ORDER BY id DESC")
    rows = cur.fetchall()
    con.close()
    return [{"id": f"INV-{str(r[0]).zfill(6)}", "ticket_id": r[1], "customer_name": r[2],
             "customer_email": r[3], "customer_phone": r[4], "device": r[5], "fault": r[6],
             "labour_cost": r[7], "parts_cost": r[8], "total": r[9], "status": r[10],
             "due_date": r[11], "notes": r[12], "created_at": r[13]} for r in rows]

@router.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: int, inv: Invoice):
    total = inv.labour_cost + inv.parts_cost
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
        UPDATE invoices SET ticket_id=?, customer_name=?, customer_email=?, customer_phone=?,
        device=?, fault=?, labour_cost=?, parts_cost=?, total=?, status=?, due_date=?, notes=?
        WHERE id=?
    """, (inv.ticket_id, inv.customer_name, inv.customer_email, inv.customer_phone,
          inv.device, inv.fault, inv.labour_cost, inv.parts_cost, total,
          inv.status, inv.due_date, inv.notes, invoice_id))
    con.commit()
    updated = cur.rowcount
    con.close()
    if updated == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "updated", "invoice_id": f"INV-{str(invoice_id).zfill(6)}"}

@router.patch("/invoices/{invoice_id}/status")
def update_invoice_status(invoice_id: int, status: str):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("UPDATE invoices SET status=? WHERE id=?", (status, invoice_id))
    con.commit()
    updated = cur.rowcount
    con.close()
    if updated == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "updated", "new_status": status}

@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: int):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("DELETE FROM invoices WHERE id=?", (invoice_id,))
    con.commit()
    deleted = cur.rowcount
    con.close()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "deleted", "invoice_id": invoice_id}

@router.get("/invoices/stats")
def invoice_stats():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT status, COUNT(*), SUM(total) FROM invoices GROUP BY status")
    rows = cur.fetchall()
    cur.execute("SELECT SUM(total) FROM invoices WHERE status='Paid'")
    paid = cur.fetchone()[0] or 0
    cur.execute("SELECT SUM(total) FROM invoices WHERE status IN ('Draft','Sent')")
    pending = cur.fetchone()[0] or 0
    con.close()
    return {"by_status": [{"status": r[0], "count": r[1], "total": r[2]} for r in rows],
            "total_revenue": paid, "pending_revenue": pending}
