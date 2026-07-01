from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import sqlite3

router = APIRouter()
DB = "nnit_doctor.db"


class Ticket(BaseModel):
    customer: str = ""
    device_brand: str = ""
    device_model: str = ""
    fault_description: str
    priority: str = "Medium"
    status: str = "Open"
    estimated_cost: str = ""
    technician_notes: str = ""


def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer TEXT,
            device_brand TEXT,
            device_model TEXT,
            fault_description TEXT,
            priority TEXT,
            status TEXT,
            estimated_cost TEXT,
            technician_notes TEXT,
            created_at TEXT
        )
    """)
    con.commit()
    con.close()


init_db()


@router.post("/tickets")
def create_ticket(ticket: Ticket):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
        INSERT INTO tickets (
            customer, device_brand, device_model, fault_description,
            priority, status, estimated_cost, technician_notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket.customer,
        ticket.device_brand,
        ticket.device_model,
        ticket.fault_description,
        ticket.priority,
        ticket.status,
        ticket.estimated_cost,
        ticket.technician_notes,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    con.commit()
    ticket_id = cur.lastrowid
    con.close()

    return {"status": "success", "ticket_id": ticket_id}


@router.get("/tickets")
def list_tickets():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT * FROM tickets ORDER BY id DESC")
    rows = cur.fetchall()
    con.close()

    return [
        {
            "id": r[0],
            "customer": r[1],
            "device_brand": r[2],
            "device_model": r[3],
            "fault_description": r[4],
            "priority": r[5],
            "status": r[6],
            "estimated_cost": r[7],
            "technician_notes": r[8],
            "created_at": r[9],
        }
        for r in rows
    ]