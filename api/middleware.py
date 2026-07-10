from fastapi import HTTPException, Header
from jose import jwt, JWTError
import hashlib

SECRET_KEY = "change-this-secret-in-production"
ALGORITHM = "HS256"

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

