from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import os

limiter = Limiter(key_func=get_remote_address)

ADMIN_RESET_KEY = os.getenv("ADMIN_RESET_KEY", "nnit-admin-2026")

def get_limiter():
    return limiter
