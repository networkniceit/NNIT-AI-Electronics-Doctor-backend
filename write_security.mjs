import { writeFileSync, readFileSync } from "fs";

writeFileSync("./api/security.py", `from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import os

limiter = Limiter(key_func=get_remote_address)

ADMIN_RESET_KEY = os.getenv("ADMIN_RESET_KEY", "nnit-admin-2026")

def get_limiter():
    return limiter
`, "utf8");

// Update main.py to add rate limiting and security headers
let main = readFileSync("./main.py", "utf8");
if (!main.includes("slowapi")) {
    main = main.replace(
        'from fastapi import FastAPI',
        'from fastapi import FastAPI, Request\nfrom fastapi.responses import JSONResponse\nfrom slowapi import Limiter, _rate_limit_exceeded_handler\nfrom slowapi.util import get_remote_address\nfrom slowapi.errors import RateLimitExceeded'
    );
    main = main.replace(
        'app = FastAPI(',
        'limiter = Limiter(key_func=get_remote_address)\napp = FastAPI('
    );
    // Add after app = FastAPI(...)
    main = main.replace(
        'app.add_middleware(',
        `app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

app.add_middleware(`
    );
    writeFileSync("./main.py", main, "utf8");
    console.log("Security added to main.py");
} else {
    console.log("Already done");
}

// Add rate limiting to auth endpoints
let auth = readFileSync("./api/auth.py", "utf8");
if (!auth.includes("limiter")) {
    auth = auth.replace(
        'from fastapi import APIRouter, HTTPException',
        'from fastapi import APIRouter, HTTPException, Request\nfrom slowapi import Limiter\nfrom slowapi.util import get_remote_address\nlimiter = Limiter(key_func=get_remote_address)'
    );
    auth = auth.replace(
        '@router.post("/auth/register")\ndef register(user: RegisterUser):',
        '@router.post("/auth/register")\n@limiter.limit("5/minute")\ndef register(request: Request, user: RegisterUser):'
    );
    auth = auth.replace(
        '@router.post("/auth/login")\ndef login(user: LoginUser):',
        '@router.post("/auth/login")\n@limiter.limit("10/minute")\ndef login(request: Request, user: LoginUser):'
    );
    writeFileSync("./api/auth.py", auth, "utf8");
    console.log("Rate limiting added to auth.py");
}

console.log("Security setup complete");
