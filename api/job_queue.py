from fastapi import APIRouter, HTTPException
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
