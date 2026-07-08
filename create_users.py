from services.db import q_enterprise

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

print("Users table ready")
