from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel
from services.db import q_enterprise, log_action

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class InventoryItem(BaseModel):
    part_name: str
    category: str = ""
    sku: str = ""
    quantity: int = 0
    min_stock_alert: int = 0
    unit_cost: float = 0
    supplier: str = ""
    notes: str = ""


@router.post("/inventory")
@limiter.limit("30/minute")
def add_inventory_item(request: Request, item: InventoryItem):
    q_enterprise(
        "INSERT INTO inventory (part_name, category, sku, quantity, min_stock_alert, unit_cost, supplier, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (item.part_name, item.category, item.sku, item.quantity, item.min_stock_alert, item.unit_cost, item.supplier, item.notes)
    )
    log_action("", "create_inventory_item", item.part_name, request.client.host if request.client else "")
    return {"status": "success"}


@router.get("/inventory/alerts")
def inventory_alerts():
    rows = q_enterprise("SELECT * FROM inventory WHERE quantity <= min_stock_alert ORDER BY quantity ASC", fetch=True) or []
    return {"count": len(rows), "items": rows}


@router.get("/inventory")
def list_inventory():
    rows = q_enterprise("SELECT * FROM inventory ORDER BY id DESC", fetch=True) or []
    for r in rows:
        qty = r.get("quantity") or 0
        cost = r.get("unit_cost") or 0
        min_alert = r.get("min_stock_alert") or 0
        r["stock_value"] = round(qty * cost, 2)
        r["low_stock"] = qty <= min_alert
    return rows


@router.delete("/inventory/{item_id}")
def delete_inventory_item(item_id: str, request: Request):
    result = q_enterprise("SELECT id FROM inventory WHERE id=?", (item_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    q_enterprise("DELETE FROM inventory WHERE id=?", (item_id,))
    log_action("", "delete_inventory_item", str(item_id), request.client.host if request.client else "")
    return {"status": "deleted", "item_id": item_id}


@router.patch("/inventory/deduct/{item_id}")
def deduct_stock(item_id: str, quantity: int = 1):
    result = q_enterprise("SELECT quantity, part_name, min_stock_alert FROM inventory WHERE id=?", (item_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
    row = result[0]
    new_qty = max(0, (row["quantity"] or 0) - quantity)
    q_enterprise("UPDATE inventory SET quantity=? WHERE id=?", (new_qty, item_id))
    alert = new_qty <= (row["min_stock_alert"] or 0)
    return {"status": "updated", "item_id": item_id, "new_quantity": new_qty, "low_stock_alert": alert, "item_name": row["part_name"]}


@router.patch("/inventory/restock/{item_id}")
def restock_item(item_id: str, quantity: int = 1):
    result = q_enterprise("SELECT quantity, part_name FROM inventory WHERE id=?", (item_id,), fetch=True)
    if not result:
        raise HTTPException(status_code=404, detail="Item not found")
    row = result[0]
    new_qty = (row["quantity"] or 0) + quantity
    q_enterprise("UPDATE inventory SET quantity=? WHERE id=?", (new_qty, item_id))
    return {"status": "updated", "item_id": item_id, "new_quantity": new_qty, "item_name": row["part_name"]}