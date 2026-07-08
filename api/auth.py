from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt
import hashlib

from services.db import q_enterprise

router = APIRouter()

# ------------------------------------------------------------------
# JWT Configuration
# ------------------------------------------------------------------

SECRET_KEY = "change-this-secret-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

# ------------------------------------------------------------------
# Models
# ------------------------------------------------------------------

class RegisterUser(BaseModel):
    username: str
    password: str
    full_name: str = ""
    role: str = "Admin"


class LoginUser(BaseModel):
    username: str
    password: str


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def create_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ------------------------------------------------------------------
# Register
# ------------------------------------------------------------------

@router.post("/auth/register")
def register(user: RegisterUser):

    exists = q_enterprise(
        "SELECT * FROM users WHERE username=?",
        (user.username,),
        fetch=True,
    )

    if exists:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    hashed = hash_password(user.password)

    q_enterprise(
        """
        INSERT INTO users
        (
            username,
            password_hash,
            full_name,
            role,
            status
        )
        VALUES
        (?, ?, ?, ?, ?)
        """,
        (
            user.username,
            hashed,
            user.full_name,
            user.role,
            "active",
        ),
    )

    return {
        "success": True,
        "message": "User registered successfully",
    }


# ------------------------------------------------------------------
# Login
# ------------------------------------------------------------------

@router.post("/auth/login")
def login(user: LoginUser):

    result = q_enterprise(
        "SELECT * FROM users WHERE username=?",
        (user.username,),
        fetch=True,
    )

    if not result:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    found = result[0]

    if hash_password(user.password) != found["password_hash"]:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    token = create_token(
        {
            "sub": found["username"],
            "role": found["role"],
            "user_id": found["id"],
        }
    )

    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": found["id"],
            "username": found["username"],
            "full_name": found["full_name"],
            "role": found["role"],
            "status": found["status"],
        },
    }


# ------------------------------------------------------------------
# Current User
# ------------------------------------------------------------------

@router.get("/auth/me")
def me():
    return {
        "message": "JWT authentication module is active"
    }