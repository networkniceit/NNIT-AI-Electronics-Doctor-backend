import hashlib
from services.db import q_enterprise

username = "admin"
password = "ChangeMe123!"
password_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()

q_enterprise(
    "INSERT INTO users (username, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?)",
    (username, password_hash, "NNIT Admin", "Admin", "active")
)

print(f"Created user: {username} / {password}")
