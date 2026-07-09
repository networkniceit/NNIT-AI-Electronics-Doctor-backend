import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DB = os.path.join(BASE_DIR, "doctor.db")
ENTERPRISE_DB = os.path.join(BASE_DIR, "nnit_doctor.db")


def get_connection(db_path=ENTERPRISE_DB):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    return con


def q(sql, p=(), fetch=False, db_path=DB):
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.execute(sql, p)
    con.commit()
    data = cur.fetchall() if fetch else None
    con.close()
    return data


def q_enterprise(sql, p=(), fetch=False):
    con = get_connection()
    cur = con.cursor()
    cur.execute(sql, p)
    con.commit()
    data = [dict(row) for row in cur.fetchall()] if fetch else None
    con.close()
    return data


def init():
    q("""
        CREATE TABLE IF NOT EXISTS customers(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            email TEXT
        )
    """)

    q("""
        CREATE TABLE IF NOT EXISTS jobs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer TEXT,
            device TEXT,
            fault TEXT,
            status TEXT DEFAULT 'new'
        )
    """)

    q("""
        CREATE TABLE IF NOT EXISTS inventory(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            qty INTEGER,
            price REAL
        )
    """)

    q_enterprise("""
        CREATE TABLE IF NOT EXISTS customers(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            email TEXT,
            address TEXT DEFAULT '',
            device TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active'
        )
    """)

    q_enterprise("""
        CREATE TABLE IF NOT EXISTS devices(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER DEFAULT 0,
            customer_name TEXT DEFAULT '',
            brand TEXT DEFAULT '',
            model TEXT DEFAULT '',
            imei TEXT DEFAULT '',
            serial_number TEXT DEFAULT '',
            color TEXT DEFAULT '',
            storage TEXT DEFAULT '',
            condition TEXT DEFAULT '',
            purchase_date TEXT DEFAULT '',
            warranty_expiry TEXT DEFAULT '',
            status TEXT DEFAULT 'active',
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    q_enterprise("""
        CREATE TABLE IF NOT EXISTS staff(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            role TEXT DEFAULT 'Technician',
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
            username TEXT DEFAULT '',
            department TEXT DEFAULT '',
            hourly_rate REAL DEFAULT 0,
            status TEXT DEFAULT 'active',
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    q_enterprise("""
        CREATE TABLE IF NOT EXISTS tickets(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer TEXT,
            device_brand TEXT,
            device_model TEXT,
            fault_description TEXT,
            priority TEXT DEFAULT 'Medium',
            status TEXT DEFAULT 'Open',
            estimated_cost TEXT DEFAULT '',
            technician_notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    q_enterprise("""
        CREATE TABLE IF NOT EXISTS inventory(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_name TEXT,
            category TEXT DEFAULT '',
            sku TEXT DEFAULT '',
            quantity INTEGER DEFAULT 0,
            min_stock_alert INTEGER DEFAULT 0,
            unit_cost REAL DEFAULT 0,
            supplier TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    q_enterprise("""
        CREATE TABLE IF NOT EXISTS invoices(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT DEFAULT '',
            customer_name TEXT,
            customer_email TEXT DEFAULT '',
            customer_phone TEXT DEFAULT '',
            device TEXT DEFAULT '',
            service TEXT DEFAULT '',
            labour_cost REAL DEFAULT 0,
            parts_cost REAL DEFAULT 0,
            total REAL DEFAULT 0,
            status TEXT DEFAULT 'Draft',
            due_date TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)


def table_count(table, db_path=ENTERPRISE_DB):
    try:
        con = sqlite3.connect(db_path)
        cur = con.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        con.close()
        return count
    except Exception:
        return 0

    q_enterprise("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            full_name TEXT DEFAULT '',
            role TEXT DEFAULT 'Admin',
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
init()



def init_users():
    q_enterprise("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            full_name TEXT DEFAULT '',
            role TEXT DEFAULT 'Admin',
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

init_users()
