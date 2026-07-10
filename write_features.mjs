import { writeFileSync, readFileSync } from "fs";

// WARRANTY API
writeFileSync("./api/warranty.py", `from fastapi import APIRouter, HTTPException
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
`, "utf8");

// JOB QUEUE API
writeFileSync("./api/job_queue.py", `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import sqlite3

router = APIRouter()
DB = "nnit_doctor.db"

class Job(BaseModel):
    ticket_id: str = ""
    customer_name: str
    device: str
    fault: str
    assigned_to: str = ""
    priority: str = "Medium"
    status: str = "Queued"
    estimated_time: str = ""
    parts_used: str = ""
    labour_minutes: int = 0
    notes: str = ""

def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS job_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT DEFAULT "",
        customer_name TEXT,
        device TEXT,
        fault TEXT,
        assigned_to TEXT DEFAULT "",
        priority TEXT DEFAULT "Medium",
        status TEXT DEFAULT "Queued",
        estimated_time TEXT DEFAULT "",
        parts_used TEXT DEFAULT "",
        labour_minutes INTEGER DEFAULT 0,
        notes TEXT DEFAULT "",
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    con.commit()
    con.close()

init_db()

@router.post("/jobs/queue")
def create_job(job: Job):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""INSERT INTO job_queue (ticket_id,customer_name,device,fault,assigned_to,priority,status,estimated_time,parts_used,labour_minutes,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (job.ticket_id,job.customer_name,job.device,job.fault,job.assigned_to,job.priority,job.status,job.estimated_time,job.parts_used,job.labour_minutes,job.notes,now,now))
    con.commit()
    jid = cur.lastrowid
    con.close()
    return {"status":"success","job_id":jid}

@router.get("/jobs/queue")
def list_jobs():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT * FROM job_queue ORDER BY id DESC")
    rows = cur.fetchall()
    con.close()
    return [{"id":r[0],"ticket_id":r[1],"customer_name":r[2],"device":r[3],"fault":r[4],"assigned_to":r[5],"priority":r[6],"status":r[7],"estimated_time":r[8],"parts_used":r[9],"labour_minutes":r[10],"notes":r[11],"created_at":r[12],"updated_at":r[13]} for r in rows]

@router.patch("/jobs/queue/{jid}/status")
def update_job_status(jid: int, status: str, assigned_to: str = ""):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    con = sqlite3.connect(DB)
    cur = con.cursor()
    if assigned_to:
        cur.execute("UPDATE job_queue SET status=?,assigned_to=?,updated_at=? WHERE id=?",(status,assigned_to,now,jid))
    else:
        cur.execute("UPDATE job_queue SET status=?,updated_at=? WHERE id=?",(status,now,jid))
    con.commit()
    con.close()
    return {"status":"updated","job_id":jid}

@router.delete("/jobs/queue/{jid}")
def delete_job(jid: int):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("DELETE FROM job_queue WHERE id=?",(jid,))
    con.commit()
    con.close()
    return {"status":"deleted"}
`, "utf8");

// REPORTS API
writeFileSync("./api/reports_api.py", `from fastapi import APIRouter
import sqlite3
from datetime import datetime, timedelta

router = APIRouter()
DB = "nnit_doctor.db"

@router.get("/reports/revenue")
def revenue_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT status, COUNT(*), SUM(total) FROM invoices GROUP BY status")
    by_status = [{"status":r[0],"count":r[1],"total":round(r[2] or 0,2)} for r in cur.fetchall()]
    cur.execute("SELECT SUM(total) FROM invoices WHERE status='Paid'")
    total_revenue = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT SUM(total) FROM invoices WHERE status IN ('Draft','Sent')")
    pending = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT SUM(total) FROM invoices WHERE status='Overdue'")
    overdue = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT COUNT(*) FROM invoices")
    total_invoices = cur.fetchone()[0]
    con.close()
    return {"total_revenue":total_revenue,"pending_revenue":pending,"overdue_revenue":overdue,"total_invoices":total_invoices,"by_status":by_status}

@router.get("/reports/tickets")
def ticket_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT status, COUNT(*) FROM tickets GROUP BY status")
    by_status = [{"status":r[0],"count":r[1]} for r in cur.fetchall()]
    cur.execute("SELECT device_brand, COUNT(*) FROM tickets GROUP BY device_brand ORDER BY COUNT(*) DESC LIMIT 10")
    top_devices = [{"device":r[0],"count":r[1]} for r in cur.fetchall()]
    cur.execute("SELECT COUNT(*) FROM tickets")
    total = cur.fetchone()[0]
    con.close()
    return {"total_tickets":total,"by_status":by_status,"top_devices":top_devices}

@router.get("/reports/inventory")
def inventory_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*), SUM(quantity), SUM(quantity*unit_cost) FROM inventory")
    r = cur.fetchone()
    cur.execute("SELECT part_name,quantity,min_stock_alert FROM inventory WHERE quantity<=min_stock_alert")
    low_stock = [{"name":r[0],"quantity":r[1],"min":r[2]} for r in cur.fetchall()]
    cur.execute("SELECT category, COUNT(*), SUM(quantity) FROM inventory GROUP BY category")
    by_category = [{"category":r[0],"items":r[1],"units":r[2]} for r in cur.fetchall()]
    con.close()
    return {"total_items":r[0],"total_units":r[1],"stock_value":round(r[2] or 0,2),"low_stock":low_stock,"by_category":by_category}

@router.get("/reports/dashboard")
def dashboard_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM customers")
    customers = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM tickets")
    tickets = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM invoices")
    invoices = cur.fetchone()[0]
    cur.execute("SELECT SUM(total) FROM invoices WHERE status='Paid'")
    revenue = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT COUNT(*) FROM inventory WHERE quantity<=min_stock_alert")
    low_stock = cur.fetchone()[0]
    con.close()
    return {"customers":customers,"tickets":tickets,"invoices":invoices,"revenue":revenue,"low_stock_alerts":low_stock}
`, "utf8");

console.log("All API files written OK");
