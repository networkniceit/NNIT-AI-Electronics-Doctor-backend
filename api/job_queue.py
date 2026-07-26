from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from services.db import q_enterprise, log_action

limiter = Limiter(key_func=get_remote_address)
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


class CompleteJobWithParts(BaseModel):
    part_ids_and_quantities: dict = {}


@router.post("/jobs/queue")
@limiter.limit("30/minute")
def create_job(request: Request, job: Job):
    q_enterprise(
        "INSERT INTO job_queue (ticket_id, customer_name, device, fault, assigned_to, priority, status, estimated_time, parts_used, labour_minutes, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (job.ticket_id, job.customer_name, job.device, job.fault, job.assigned_to, job.priority, job.status, job.estimated_time, job.parts_used, job.labour_minutes, job.notes)
    )
    log_action("", "create_job", job.customer_name, request.client.host if request.client else "")
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


@router.post("/jobs/queue/{jid}/complete")
def complete_job_with_deduction(jid: str, data: CompleteJobWithParts):
    result = q_enterprise("SELECT id FROM job_queue WHERE id=?", (jid,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")

    deducted = []
    for item_id, qty in data.part_ids_and_quantities.items():
        item_result = q_enterprise("SELECT quantity, part_name FROM inventory WHERE id=?", (item_id,), fetch=True)
        if item_result:
            row = item_result[0]
            new_qty = max(0, (row["quantity"] or 0) - int(qty))
            q_enterprise("UPDATE inventory SET quantity=? WHERE id=?", (new_qty, item_id))
            deducted.append({"item_id": item_id, "item_name": row["part_name"], "deducted": qty, "new_quantity": new_qty})

    q_enterprise("UPDATE job_queue SET status=? WHERE id=?", ("Done", jid))
    return {"status": "completed", "job_id": jid, "parts_deducted": deducted}


@router.delete("/jobs/queue/{jid}")
def delete_job(jid: str, request: Request):
    result = q_enterprise("SELECT id FROM job_queue WHERE id=?", (jid,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    q_enterprise("DELETE FROM job_queue WHERE id=?", (jid,))
    log_action("", "delete_job", str(jid), request.client.host if request.client else "")
    return {"status": "deleted"}