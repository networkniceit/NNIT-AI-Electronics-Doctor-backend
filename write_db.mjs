import { writeFileSync } from "fs";
const code = `import os
import sqlite3

# Try to use PostgreSQL if DATABASE_URL is set, otherwise fall back to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL:
    try:
        import psycopg2
        import psycopg2.extras
        USE_POSTGRES = True
    except ImportError:
        USE_POSTGRES = False
else:
    USE_POSTGRES = False

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB = os.path.join(BASE_DIR, "doctor.db")
ENTERPRISE_DB = os.path.join(BASE_DIR, "nnit_doctor.db")


def get_pg_connection():
    url = DATABASE_URL
    # Railway sometimes uses postgres:// instead of postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    con = psycopg2.connect(url, sslmode="require")
    return con


def get_connection(db_path=None):
    if USE_POSTGRES:
        return get_pg_connection()
    con = sqlite3.connect(db_path or ENTERPRISE_DB)
    con.row_factory = sqlite3.Row
    return con


def q(sql, p=(), fetch=False, db_path=None):
    if USE_POSTGRES:
        # Convert SQLite ? placeholders to PostgreSQL %s
        sql = sql.replace("?", "%s")
        con = get_pg_connection()
        cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, p)
        con.commit()
        data = [dict(r) for r in cur.fetchall()] if fetch else None
        con.close()
        return data
    con = sqlite3.connect(db_path or DB)
    cur = con.cursor()
    cur.execute(sql, p)
    con.commit()
    data = cur.fetchall() if fetch else None
    con.close()
    return data


def q_enterprise(sql, p=(), fetch=False):
    if USE_POSTGRES:
        sql = sql.replace("?", "%s")
        # Convert SQLite INTEGER PRIMARY KEY AUTOINCREMENT to PostgreSQL SERIAL
        con = get_pg_connection()
        cur = con.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, p)
        con.commit()
        data = [dict(r) for r in cur.fetchall()] if fetch else None
        con.close()
        return data
    con = sqlite3.connect(ENTERPRISE_DB)
    cur = con.cursor()
    cur.execute(sql, p)
    con.commit()
    data = [dict(row) for row in cur.fetchall()] if fetch else None
    con.close()
    return data


def _create_tables_pg():
    """Create all tables in PostgreSQL using SERIAL instead of AUTOINCREMENT."""
    con = get_pg_connection()
    cur = con.cursor()
    tables = [
        """CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY, name TEXT, phone TEXT, email TEXT,
            address TEXT DEFAULT '', device TEXT DEFAULT '', notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'active'
        )""",
        """CREATE TABLE IF NOT EXISTS devices (
            id SERIAL PRIMARY KEY, customer_id INTEGER DEFAULT 0,
            customer_name TEXT DEFAULT '', brand TEXT DEFAULT '', model TEXT DEFAULT '',
            imei TEXT DEFAULT '', serial_number TEXT DEFAULT '', color TEXT DEFAULT '',
            storage TEXT DEFAULT '', condition TEXT DEFAULT '', purchase_date TEXT DEFAULT '',
            warranty_expiry TEXT DEFAULT '', status TEXT DEFAULT 'active',
            notes TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS staff (
            id SERIAL PRIMARY KEY, full_name TEXT, role TEXT DEFAULT 'Technician',
            phone TEXT DEFAULT '', email TEXT DEFAULT '', username TEXT DEFAULT '',
            department TEXT DEFAULT '', hourly_rate REAL DEFAULT 0,
            status TEXT DEFAULT 'active', notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY, customer TEXT, device_brand TEXT,
            device_model TEXT, fault_description TEXT, priority TEXT DEFAULT 'Medium',
            status TEXT DEFAULT 'Open', estimated_cost TEXT DEFAULT '',
            technician_notes TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS inventory (
            id SERIAL PRIMARY KEY, part_name TEXT, category TEXT DEFAULT '',
            sku TEXT DEFAULT '', quantity INTEGER DEFAULT 0,
            min_stock_alert INTEGER DEFAULT 0, unit_cost REAL DEFAULT 0,
            supplier TEXT DEFAULT '', notes TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY, ticket_id TEXT DEFAULT '',
            customer_name TEXT, customer_email TEXT DEFAULT '',
            customer_phone TEXT DEFAULT '', device TEXT DEFAULT '',
            fault TEXT DEFAULT '', labour_cost REAL DEFAULT 0,
            parts_cost REAL DEFAULT 0, total REAL DEFAULT 0,
            status TEXT DEFAULT 'Draft', due_date TEXT DEFAULT '',
            notes TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS warranties (
            id SERIAL PRIMARY KEY, ticket_id TEXT DEFAULT '',
            customer_name TEXT, device TEXT, serial_number TEXT DEFAULT '',
            warranty_type TEXT DEFAULT 'Repair Warranty',
            start_date TEXT, end_date TEXT, status TEXT DEFAULT 'Active',
            notes TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS job_queue (
            id SERIAL PRIMARY KEY, ticket_id TEXT DEFAULT '',
            customer_name TEXT, device TEXT, fault TEXT,
            assigned_to TEXT DEFAULT '', priority TEXT DEFAULT 'Medium',
            status TEXT DEFAULT 'Queued', estimated_time TEXT DEFAULT '',
            parts_used TEXT DEFAULT '', labour_minutes INTEGER DEFAULT 0,
            notes TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS device_history (
            id SERIAL PRIMARY KEY, customer_id TEXT DEFAULT '',
            customer_name TEXT, device TEXT, event_type TEXT DEFAULT 'Repair',
            description TEXT, cost REAL DEFAULT 0, technician TEXT DEFAULT '',
            ticket_id TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, username TEXT UNIQUE,
            password_hash TEXT, full_name TEXT DEFAULT '',
            role TEXT DEFAULT 'Admin', status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""",
    ]
    for t in tables:
        cur.execute(t)
    con.commit()
    con.close()


def init():
    if USE_POSTGRES:
        _create_tables_pg()
        return
    # SQLite fallback
    q("""CREATE TABLE IF NOT EXISTS customers(
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, email TEXT
    )""")
    q("""CREATE TABLE IF NOT EXISTS jobs(
        id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT, device TEXT,
        fault TEXT, status TEXT DEFAULT 'new'
    )""")
    q("""CREATE TABLE IF NOT EXISTS inventory(
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, qty INTEGER, price REAL
    )""")
    q_enterprise("""CREATE TABLE IF NOT EXISTS customers(
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, email TEXT,
        address TEXT DEFAULT '', device TEXT DEFAULT '', notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'active'
    )""")
    q_enterprise("""CREATE TABLE IF NOT EXISTS devices(
        id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER DEFAULT 0,
        customer_name TEXT DEFAULT '', brand TEXT DEFAULT '', model TEXT DEFAULT '',
        imei TEXT DEFAULT '', serial_number TEXT DEFAULT '', color TEXT DEFAULT '',
        storage TEXT DEFAULT '', condition TEXT DEFAULT '', purchase_date TEXT DEFAULT '',
        warranty_expiry TEXT DEFAULT '', status TEXT DEFAULT 'active',
        notes TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    q_enterprise("""CREATE TABLE IF NOT EXISTS staff(
        id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT,
        role TEXT DEFAULT 'Technician', phone TEXT DEFAULT '', email TEXT DEFAULT '',
        username TEXT DEFAULT '', department TEXT DEFAULT '', hourly_rate REAL DEFAULT 0,
        status TEXT DEFAULT 'active', notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    q_enterprise("""CREATE TABLE IF NOT EXISTS tickets(
        id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT, device_brand TEXT,
        device_model TEXT, fault_description TEXT, priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Open', estimated_cost TEXT DEFAULT '',
        technician_notes TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    q_enterprise("""CREATE TABLE IF NOT EXISTS inventory(
        id INTEGER PRIMARY KEY AUTOINCREMENT, part_name TEXT, category TEXT DEFAULT '',
        sku TEXT DEFAULT '', quantity INTEGER DEFAULT 0, min_stock_alert INTEGER DEFAULT 0,
        unit_cost REAL DEFAULT 0, supplier TEXT DEFAULT '', notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")
    q_enterprise("""CREATE TABLE IF NOT EXISTS invoices(
        id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id TEXT DEFAULT '',
        customer_name TEXT, customer_email TEXT DEFAULT '', customer_phone TEXT DEFAULT '',
        device TEXT DEFAULT '', fault TEXT DEFAULT '', labour_cost REAL DEFAULT 0,
        parts_cost REAL DEFAULT 0, total REAL DEFAULT 0, status TEXT DEFAULT 'Draft',
        due_date TEXT DEFAULT '', notes TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")


def init_users():
    if USE_POSTGRES:
        return  # Already created in _create_tables_pg
    q_enterprise("""CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE,
        password_hash TEXT, full_name TEXT DEFAULT '', role TEXT DEFAULT 'Admin',
        status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")


def table_count(table, db_path=None):
    try:
        if USE_POSTGRES:
            con = get_pg_connection()
            cur = con.cursor()
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            con.close()
            return count
        con = sqlite3.connect(db_path or ENTERPRISE_DB)
        cur = con.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        con.close()
        return count
    except Exception:
        return 0


init()
init_users()
`;
writeFileSync("./services/db.py", code, "utf8");
console.log("db.py rewritten for PostgreSQL OK");
