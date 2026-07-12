import { writeFileSync } from "fs";
writeFileSync("./api/payments.py", `from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os

router = APIRouter()

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://nnit-ai-electronics-doctor-frontend-production.up.railway.app")

class PaymentIntent(BaseModel):
    amount: float
    currency: str = "eur"
    customer_name: str = ""
    invoice_id: str = ""
    description: str = ""

class CheckoutSession(BaseModel):
    amount: float
    currency: str = "eur"
    customer_name: str = ""
    customer_email: str = ""
    invoice_id: str = ""
    description: str = ""

@router.get("/payments/config")
def payment_config():
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "stripe_configured": bool(STRIPE_SECRET_KEY),
        "currency": "eur"
    }

@router.post("/payments/create-intent")
def create_payment_intent(payment: PaymentIntent):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe not configured. Add STRIPE_SECRET_KEY to Railway variables.")
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        intent = stripe.PaymentIntent.create(
            amount=int(payment.amount * 100),
            currency=payment.currency,
            metadata={
                "customer_name": payment.customer_name,
                "invoice_id": payment.invoice_id,
                "description": payment.description
            }
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": payment.amount,
            "currency": payment.currency
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payments/create-checkout")
def create_checkout_session(session: CheckoutSession):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=400, detail="Stripe not configured.")
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        checkout = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": session.currency,
                    "product_data": {
                        "name": f"Invoice {session.invoice_id}",
                        "description": session.description or f"Repair service for {session.customer_name}"
                    },
                    "unit_amount": int(session.amount * 100)
                },
                "quantity": 1
            }],
            mode="payment",
            customer_email=session.customer_email or None,
            success_url=f"{FRONTEND_URL}?payment=success&invoice={session.invoice_id}",
            cancel_url=f"{FRONTEND_URL}?payment=cancelled",
            metadata={
                "invoice_id": session.invoice_id,
                "customer_name": session.customer_name
            }
        )
        return {
            "checkout_url": checkout.url,
            "session_id": checkout.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payments/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        return {"status": "webhook_secret_not_configured"}
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            invoice_id = payment_intent.get("metadata", {}).get("invoice_id", "")
            print(f"Payment succeeded for invoice {invoice_id}")
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
`, "utf8");
console.log("payments.py written OK");
