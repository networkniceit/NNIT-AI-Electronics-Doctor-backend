from fastapi import APIRouter
from services.db import q
router=APIRouter()
@router.post("/jobs")
def add_job(customer:str, device:str, fault:str):
    q("INSERT INTO jobs(customer,device,fault) VALUES(?,?,?)",(customer,device,fault)); return {"status":"job created"}
@router.get("/jobs")
def jobs():
    return q("SELECT * FROM jobs", fetch=True)
