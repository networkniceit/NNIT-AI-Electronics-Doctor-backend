from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q_enterprise

router = APIRouter()


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


@router.post("/jobs/queue")
def create_job(job: Job):
    q_enterprise(
        "INSERT INTO job_queue (ticket_id, customer_name, device, fault, assigned_to, priority, status, estimated_time, parts_used, labour_minutes, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (job.ticket_id, job.customer_name, job.device, job.fault, job.assigned_to, job.priority, job.status, job.estimated_time, job.parts_used, job.labour_minutes, job.notes)
    )
    return {"status": "success"}


@router.get("/jobs/queue")
def list_jobs():
    rows = q_enterprise("SELECT * FROM job_queue ORDER BY id DESC", fetch=True)
    return rows or []


@router.patch("/jobs/queue/{jid}/status")
def update_job_status(jid: str, status: str, assigned_to: str = ""):
    result = q_enterprise("SELECT id FROM job_queue WHERE id=?", (jid,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    if assigned_to:
        q_enterprise("UPDATE job_queue SET status=?, assigned_to=? WHERE id=?", (status, assigned_to, jid))
    else:
        q_enterprise("UPDATE job_queue SET status=? WHERE id=?", (status, jid))
    return {"status": "updated", "job_id": jid}


@router.delete("/jobs/queue/{jid}")
def delete_job(jid: str):
    result = q_enterprise("SELECT id FROM job_queue WHERE id=?", (jid,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    q_enterprise("DELETE FROM job_queue WHERE id=?", (jid,))
    return {"status": "deleted"}