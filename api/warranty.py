from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import sqlite3

router = APIRouter()
DB = "nnit_doctor.db"

class Warranty(BaseModel):
    ticket_id: str = ""
    customer_name: str
    device: str
    serial_number: str = ""
    warranty_type: str = "Repair Warranty"
    start_date: str = ""
    end_date: str = ""
    notes: str = ""

def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS warranties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT DEFAULT "",
        customer_name TEXT,
        device TEXT,
        serial_number TEXT DEFAULT "",
        warranty_type TEXT DEFAULT "Repair Warranty",
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT "Active",
        notes TEXT DEFAULT "",
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    con.commit()
    con.close()

init_db()

@router.post("/warranty")
def create_warranty(w: Warranty):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""INSERT INTO warranties (ticket_id,customer_name,device,serial_number,warranty_type,start_date,end_date,notes,created_at)
        VALUES (?,?,?,?,?,?,?,?,?)""",
        (w.ticket_id,w.customer_name,w.device,w.serial_number,w.warranty_type,w.start_date,w.end_date,w.notes,datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    con.commit()
    wid = cur.lastrowid
    con.close()
    return {"status":"success","warranty_id":wid}

@router.get("/warranty")
def list_warranties():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT * FROM warranties ORDER BY id DESC")
    rows = cur.fetchall()
    con.close()
    return [{"id":r[0],"ticket_id":r[1],"customer_name":r[2],"device":r[3],"serial_number":r[4],"warranty_type":r[5],"start_date":r[6],"end_date":r[7],"status":r[8],"notes":r[9],"created_at":r[10]} for r in rows]

@router.delete("/warranty/{wid}")
def delete_warranty(wid: int):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("DELETE FROM warranties WHERE id=?", (wid,))
    con.commit()
    con.close()
    return {"status":"deleted"}
