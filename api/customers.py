from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q, q_enterprise

router = APIRouter()


class Customer(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""
    device: str = ""
    notes: str = ""


# ------------------------
# Create Customer
# ------------------------
@router.post("/customers")
def add_customer(customer: Customer):

    q_enterprise(
        """
        INSERT INTO customers
        (name, phone, email, address, device, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.device,
            customer.notes,
        ),
    )

    return {
        "success": True,
        "message": "Customer added successfully"
    }


# ------------------------
# List Customers
# ------------------------
@router.get("/customers")
def customers():

    return q_enterprise(
        "SELECT * FROM customers ORDER BY id DESC",
        fetch=True,
    )


# ------------------------
# Get Customer
# ------------------------
@router.get("/customers/{customer_id}")
def get_customer(customer_id: int):

    data = q_enterprise(
        "SELECT * FROM customers WHERE id=?",
        (customer_id,),
        fetch=True,
    )

    if not data:
        raise HTTPException(404, "Customer not found")

    return data[0]


# ------------------------
# Update Customer
# ------------------------
@router.put("/customers/{customer_id}")
def update_customer(customer_id: int, customer: Customer):

    q_enterprise(
        """
        UPDATE customers
        SET
            name=?,
            phone=?,
            email=?,
            address=?,
            device=?,
            notes=?
        WHERE id=?
        """,
        (
            customer.name,
            customer.phone,
            customer.email,
            customer.address,
            customer.device,
            customer.notes,
            customer_id,
        ),
    )

    return {
        "success": True,
        "message": "Customer updated"
    }


# ------------------------
# Delete Customer
# ------------------------
@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: int):

    q_enterprise(
        "DELETE FROM customers WHERE id=?",
        (customer_id,),
    )

    return {
        "success": True,
        "message": "Customer deleted"
    }


# ------------------------
# Search Customers
# ------------------------
@router.get("/customers/search/{query}")
def search_customer(query: str):

    like = f"%{query}%"

    return q_enterprise(
        """
        SELECT *
        FROM customers
        WHERE
            name LIKE ?
            OR phone LIKE ?
            OR email LIKE ?
            OR device LIKE ?
        ORDER BY id DESC
        """,
        (
            like,
            like,
            like,
            like,
        ),
        fetch=True,
    )


# ------------------------
# Customer Statistics
# ------------------------
@router.get("/customers/stats")
def customer_stats():

    total = q_enterprise(
        "SELECT COUNT(*) AS total FROM customers",
        fetch=True,
    )[0]["total"]

    return {
        "total_customers": total
    }