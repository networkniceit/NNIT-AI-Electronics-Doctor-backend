from fastapi import APIRouter
from datetime import datetime
import os
import sqlite3

router = APIRouter()

DB = "nnit_doctor.db"


@router.get("/enterprise/status")
def enterprise_status():
    db_exists = os.path.exists(DB)

    tables = []
    if db_exists:
        con = sqlite3.connect(DB)
        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cur.fetchall()]
        con.close()

    return {
        "platform": "NNIT Enterprise",
        "module": "AI Electronics Doctor Pro",
        "status": "online",
        "version": "1.0.0",
        "database": DB,
        "database_found": db_exists,
        "tables": tables,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }