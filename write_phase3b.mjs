import { writeFileSync, readFileSync } from "fs";

// DEVICE HISTORY API
writeFileSync("./api/device_history.py", `from fastapi import APIRouter
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
`, "utf8");

// STOCK DEDUCTION API - add to inventory.py
let inv = readFileSync("./api/inventory.py", "utf8");
if (!inv.includes("/inventory/deduct")) {
    inv += `

@router.patch("/inventory/deduct/{item_id}")
def deduct_stock(item_id: int, quantity: int = 1):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT quantity, part_name, min_stock_alert FROM inventory WHERE id=?", (item_id,))
    row = cur.fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Item not found")
    new_qty = max(0, row[0] - quantity)
    cur.execute("UPDATE inventory SET quantity=? WHERE id=?", (new_qty, item_id))
    con.commit()
    con.close()
    alert = new_qty <= row[2]
    return {"status":"updated","item_id":item_id,"new_quantity":new_qty,"low_stock_alert":alert,"item_name":row[1]}

@router.patch("/inventory/restock/{item_id}")
def restock_item(item_id: int, quantity: int = 1):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT quantity, part_name FROM inventory WHERE id=?", (item_id,))
    row = cur.fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Item not found")
    new_qty = row[0] + quantity
    cur.execute("UPDATE inventory SET quantity=? WHERE id=?", (new_qty, item_id))
    con.commit()
    con.close()
    return {"status":"updated","item_id":item_id,"new_quantity":new_qty,"item_name":row[1]}
`;
    writeFileSync("./api/inventory.py", inv, "utf8");
}

// PASSWORD CHANGE - add to auth.py
let auth = readFileSync("./api/auth.py", "utf8");
if (!auth.includes("/auth/change-password")) {
    auth += `

class ChangePassword(BaseModel):
    username: str
    current_password: str
    new_password: str

@router.post("/auth/change-password")
def change_password(data: ChangePassword):
    result = q_enterprise(
        "SELECT * FROM users WHERE username=?",
        (data.username,),
        fetch=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    found = result[0]
    if hash_password(data.current_password) != found["password_hash"]:
        raise HTTPException(status_code=401, detail="Current password incorrect")
    new_hash = hash_password(data.new_password)
    q_enterprise(
        "UPDATE users SET password_hash=? WHERE username=?",
        (new_hash, data.username)
    )
    return {"success": True, "message": "Password changed successfully"}

class ResetPassword(BaseModel):
    username: str
    new_password: str
    admin_key: str

@router.post("/auth/reset-password")
def reset_password(data: ResetPassword):
    import os
    admin_key = os.getenv("ADMIN_RESET_KEY", "nnit-admin-2026")
    if data.admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    result = q_enterprise("SELECT id FROM users WHERE username=?", (data.username,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    new_hash = hash_password(data.new_password)
    q_enterprise("UPDATE users SET password_hash=? WHERE username=?", (new_hash, data.username))
    return {"success": True, "message": "Password reset successfully"}
`;
    writeFileSync("./api/auth.py", auth, "utf8");
}

console.log("Phase 3b backend files written OK");
