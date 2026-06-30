from fastapi import APIRouter
from datetime import datetime
import os
import sqlite3

from services.db import ENTERPRISE_DB, table_count

router = APIRouter()

DB = ENTERPRISE_DB


def db_exists():
    return os.path.exists(DB)


def get_tables():
    if not db_exists():
        return []

    try:
        con = sqlite3.connect(DB)
        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cur.fetchall()]
        con.close()
        return tables
    except Exception:
        return []


def get_count(table):
    return table_count(table)


@router.get("/enterprise/status")
def enterprise_status():

    return {
        "platform": "NNIT Enterprise",
        "module": "AI Electronics Doctor Pro",
        "status": "online",
        "backend": "Online",
        "version": "1.0.0",
        "database": DB,
        "database_found": db_exists(),
        "tables": get_tables(),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/enterprise/dashboard")
def enterprise_dashboard():

    customers = get_count("customers")
    tickets = get_count("tickets")
    inventory = get_count("inventory")
    invoices = get_count("invoices")

    return {

        "enterprise": {
            "name": "NNIT Enterprise",
            "module": "AI Electronics Doctor Pro",
            "version": "1.0.0",
            "backend": "Online"
        },

        "database": {
            "name": os.path.basename(DB),
            "path": DB,
            "available": db_exists(),
            "tables": get_tables()
        },

        "statistics": {
            "customers": customers,
            "tickets": tickets,
            "inventory": inventory,
            "invoices": invoices,
            "total_records": customers + tickets + inventory + invoices
        },

        "modules": {
            "customers": True,
            "tickets": True,
            "inventory": True,
            "invoices": True,
            "analytics": True,
            "calendar": True,
            "whatsapp": True,
            "scanner": True,
            "ai": True
        },

        "system": {
            "database_engine": "SQLite",
            "enterprise_ready": True
        },

        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/enterprise/modules")
def enterprise_modules():

    return {
        "platform": "NNIT Enterprise",

        "modules": [
            {
                "name": "Dashboard",
                "enabled": True
            },
            {
                "name": "Customers",
                "enabled": True
            },
            {
                "name": "Tickets",
                "enabled": True
            },
            {
                "name": "Inventory",
                "enabled": True
            },
            {
                "name": "Invoices",
                "enabled": True
            },
            {
                "name": "Analytics",
                "enabled": True
            },
            {
                "name": "Calendar",
                "enabled": True
            },
            {
                "name": "WhatsApp",
                "enabled": True
            },
            {
                "name": "QR Scanner",
                "enabled": True
            },
            {
                "name": "AI Vision",
                "enabled": True
            }
        ],

        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }