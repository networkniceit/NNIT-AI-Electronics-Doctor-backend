from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.db import q_enterprise

router = APIRouter()


class Device(BaseModel):
    customer_id: int = 0
    customer_name: str = ""
    brand: str = ""
    model: str = ""
    imei: str = ""
    serial_number: str = ""
    color: str = ""
    storage: str = ""
    condition: str = ""
    purchase_date: str = ""
    warranty_expiry: str = ""
    status: str = "active"
    notes: str = ""


@router.post("/devices")
def add_device(device: Device):
    q_enterprise("""
        INSERT INTO devices (
            customer_id, customer_name, brand, model, imei, serial_number,
            color, storage, condition, purchase_date, warranty_expiry,
            status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        device.customer_id,
        device.customer_name,
        device.brand,
        device.model,
        device.imei,
        device.serial_number,
        device.color,
        device.storage,
        device.condition,
        device.purchase_date,
        device.warranty_expiry,
        device.status,
        device.notes
    ))

    return {"success": True, "message": "Device added successfully"}


@router.get("/devices")
def list_devices():
    return q_enterprise(
        "SELECT * FROM devices ORDER BY id DESC",
        fetch=True
    )


@router.get("/devices/{device_id}")
def get_device(device_id: int):
    data = q_enterprise(
        "SELECT * FROM devices WHERE id=?",
        (device_id,),
        fetch=True
    )

    if not data:
        raise HTTPException(404, "Device not found")

    return data[0]


@router.put("/devices/{device_id}")
def update_device(device_id: int, device: Device):
    q_enterprise("""
        UPDATE devices SET
            customer_id=?,
            customer_name=?,
            brand=?,
            model=?,
            imei=?,
            serial_number=?,
            color=?,
            storage=?,
            condition=?,
            purchase_date=?,
            warranty_expiry=?,
            status=?,
            notes=?
        WHERE id=?
    """, (
        device.customer_id,
        device.customer_name,
        device.brand,
        device.model,
        device.imei,
        device.serial_number,
        device.color,
        device.storage,
        device.condition,
        device.purchase_date,
        device.warranty_expiry,
        device.status,
        device.notes,
        device_id
    ))

    return {"success": True, "message": "Device updated"}


@router.delete("/devices/{device_id}")
def delete_device(device_id: int):
    q_enterprise(
        "DELETE FROM devices WHERE id=?",
        (device_id,)
    )

    return {"success": True, "message": "Device deleted"}


@router.get("/devices/customer/{customer_id}")
def devices_by_customer(customer_id: int):
    return q_enterprise(
        "SELECT * FROM devices WHERE customer_id=? ORDER BY id DESC",
        (customer_id,),
        fetch=True
    )


@router.get("/devices/search/{query}")
def search_devices(query: str):
    like = f"%{query}%"

    return q_enterprise("""
        SELECT *
        FROM devices
        WHERE
            customer_name LIKE ?
            OR brand LIKE ?
            OR model LIKE ?
            OR imei LIKE ?
            OR serial_number LIKE ?
        ORDER BY id DESC
    """, (
        like,
        like,
        like,
        like,
        like
    ), fetch=True)


@router.get("/devices/stats")
def device_stats():
    total = q_enterprise(
        "SELECT COUNT(*) AS total FROM devices",
        fetch=True
    )[0]["total"]

    active = q_enterprise(
        "SELECT COUNT(*) AS total FROM devices WHERE status='active'",
        fetch=True
    )[0]["total"]

    return {
        "total_devices": total,
        "active_devices": active
    }