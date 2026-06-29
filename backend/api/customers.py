from fastapi import APIRouter
from services.db import q
router=APIRouter()
@router.post("/customers")
def add_customer(name:str, phone:str="", email:str=""):
    q("INSERT INTO customers(name,phone,email) VALUES(?,?,?)",(name,phone,email)); return {"status":"saved"}
@router.get("/customers")
def customers():
    return q("SELECT * FROM customers", fetch=True)
