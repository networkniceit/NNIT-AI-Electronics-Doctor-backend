from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q_enterprise

router = APIRouter()


class Staff(BaseModel):
    full_name: str
    role: str = "Technician"
    phone: str = ""
    email: str = ""
    username: str = ""
    department: str = ""
    hourly_rate: float = 0
    status: str = "active"
    notes: str = ""


@router.post("/staff")
def add_staff(staff: Staff):
    q_enterprise("""
        INSERT INTO staff (
            full_name, role, phone, email, username,
            department, hourly_rate, status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        staff.full_name,
        staff.role,
        staff.phone,
        staff.email,
        staff.username,
        staff.department,
        staff.hourly_rate,
        staff.status,
        staff.notes
    ))

    return {"success": True, "message": "Staff member added"}


@router.get("/staff")
def list_staff():
    return q_enterprise(
        "SELECT * FROM staff ORDER BY id DESC",
        fetch=True
    )


@router.get("/staff/{staff_id}")
def get_staff(staff_id: int):
    data = q_enterprise(
        "SELECT * FROM staff WHERE id=?",
        (staff_id,),
        fetch=True
    )

    if not data:
        raise HTTPException(404, "Staff member not found")

    return data[0]


@router.put("/staff/{staff_id}")
def update_staff(staff_id: int, staff: Staff):
    q_enterprise("""
        UPDATE staff SET
            full_name=?,
            role=?,
            phone=?,
            email=?,
            username=?,
            department=?,
            hourly_rate=?,
            status=?,
            notes=?
        WHERE id=?
    """, (
        staff.full_name,
        staff.role,
        staff.phone,
        staff.email,
        staff.username,
        staff.department,
        staff.hourly_rate,
        staff.status,
        staff.notes,
        staff_id
    ))

    return {"success": True, "message": "Staff member updated"}


@router.delete("/staff/{staff_id}")
def delete_staff(staff_id: int):
    q_enterprise(
        "DELETE FROM staff WHERE id=?",
        (staff_id,)
    )

    return {"success": True, "message": "Staff member deleted"}


@router.get("/staff/search/{query}")
def search_staff(query: str):
    like = f"%{query}%"

    return q_enterprise("""
        SELECT *
        FROM staff
        WHERE
            full_name LIKE ?
            OR role LIKE ?
            OR phone LIKE ?
            OR email LIKE ?
            OR username LIKE ?
            OR department LIKE ?
        ORDER BY id DESC
    """, (
        like,
        like,
        like,
        like,
        like,
        like
    ), fetch=True)


@router.get("/staff/stats")
def staff_stats():
    total = q_enterprise(
        "SELECT COUNT(*) AS total FROM staff",
        fetch=True
    )[0]["total"]

    active = q_enterprise(
        "SELECT COUNT(*) AS total FROM staff WHERE status='active'",
        fetch=True
    )[0]["total"]

    technicians = q_enterprise(
        "SELECT COUNT(*) AS total FROM staff WHERE role='Technician'",
        fetch=True
    )[0]["total"]

    return {
        "total_staff": total,
        "active_staff": active,
        "technicians": technicians
    }