from fastapi import APIRouter
from datetime import datetime
import os
import sqlite3

router = APIRouter()

DB = "nnit_doctor.db"


def get_count(table):
    try:
        con = sqlite3.connect(DB)
        cur = con.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        con.close()
        return count
    except:
        return 0


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


@router.get("/enterprise/dashboard")
def enterprise_dashboard():

    return {
        "enterprise": {
            "name": "NNIT Enterprise",
            "module": "AI Electronics Doctor Pro",
            "version": "1.0.0",
            "backend": "Online"
        },

        "database": {
            "name": DB,
            "available": os.path.exists(DB)
        },

        "statistics": {
            "customers": get_count("customers"),
            "tickets": get_count("tickets"),
            "inventory": get_count("inventory"),
            "invoices": get_count("invoices")
        },

        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }