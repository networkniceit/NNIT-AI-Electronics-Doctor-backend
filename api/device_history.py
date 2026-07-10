from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import sqlite3

router = APIRouter()
DB = "nnit_doctor.db"

class HistoryEvent(BaseModel):
    customer_id: str = ""
    customer_name: str
    device: str
    event_type: str = "Repair"
    description: str
    cost: float = 0
    technician: str = ""
    ticket_id: str = ""

def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS device_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT DEFAULT "",
        customer_name TEXT,
        device TEXT,
        event_type TEXT DEFAULT "Repair",
        description TEXT,
        cost REAL DEFAULT 0,
        technician TEXT DEFAULT "",
        ticket_id TEXT DEFAULT "",
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    con.commit()
    con.close()

init_db()

@router.post("/device-history")
def add_history(event: HistoryEvent):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""INSERT INTO device_history (customer_id,customer_name,device,event_type,description,cost,technician,ticket_id,created_at)
        VALUES (?,?,?,?,?,?,?,?,?)""",
        (event.customer_id,event.customer_name,event.device,event.event_type,event.description,event.cost,event.technician,event.ticket_id,datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    con.commit()
    hid = cur.lastrowid
    con.close()
    return {"status":"success","history_id":hid}

@router.get("/device-history")
def list_history(customer_name: str = "", device: str = ""):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    if customer_name:
        cur.execute("SELECT * FROM device_history WHERE customer_name LIKE ? ORDER BY id DESC", (f"%{customer_name}%",))
    elif device:
        cur.execute("SELECT * FROM device_history WHERE device LIKE ? ORDER BY id DESC", (f"%{device}%",))
    else:
        cur.execute("SELECT * FROM device_history ORDER BY id DESC LIMIT 100")
    rows = cur.fetchall()
    con.close()
    return [{"id":r[0],"customer_id":r[1],"customer_name":r[2],"device":r[3],"event_type":r[4],"description":r[5],"cost":r[6],"technician":r[7],"ticket_id":r[8],"created_at":r[9]} for r in rows]

@router.delete("/device-history/{hid}")
def delete_history(hid: int):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("DELETE FROM device_history WHERE id=?", (hid,))
    con.commit()
    con.close()
    return {"status":"deleted"}
