from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import sqlite3

router = APIRouter()
DB = "nnit_doctor.db"


class InventoryItem(BaseModel):
    part_name: str
    category: str = ""
    sku: str = ""
    quantity: int = 0
    min_stock_alert: int = 0
    unit_cost: float = 0
    supplier: str = ""
    notes: str = ""


def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_name TEXT,
            category TEXT,
            sku TEXT,
            quantity INTEGER,
            min_stock_alert INTEGER,
            unit_cost REAL,
            supplier TEXT,
            notes TEXT,
            created_at TEXT
        )
    """)
    con.commit()
    con.close()


init_db()


@router.post("/inventory")
def add_inventory_item(item: InventoryItem):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
        INSERT INTO inventory (
            part_name, category, sku, quantity, min_stock_alert,
            unit_cost, supplier, notes, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item.part_name,
        item.category,
        item.sku,
        item.quantity,
        item.min_stock_alert,
        item.unit_cost,
        item.supplier,
        item.notes,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    con.commit()
    item_id = cur.lastrowid
    con.close()

    return {
        "status": "success",
        "item_id": item_id
    }


@router.get("/inventory")
def list_inventory():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT * FROM inventory ORDER BY id DESC")
    rows = cur.fetchall()
    con.close()

    return [
        {
            "id": r[0],
            "part_name": r[1],
            "category": r[2],
            "sku": r[3],
            "quantity": r[4],
            "min_stock_alert": r[5],
            "unit_cost": r[6],
            "supplier": r[7],
            "notes": r[8],
            "created_at": r[9],
            "stock_value": round((r[4] or 0) * (r[6] or 0), 2),
            "low_stock": (r[4] or 0) <= (r[5] or 0)
        }
        for r in rows
    ]


@router.delete("/inventory/{item_id}")
def delete_inventory_item(item_id: int):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("DELETE FROM inventory WHERE id = ?", (item_id,))
    con.commit()
    deleted = cur.rowcount
    con.close()

    if deleted == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    return {
        "status": "deleted",
        "item_id": item_id
    }

@router.patch("/inventory/deduct/{item_id}")
def deduct_stock(item_id: int, quantity: int = 1):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT quantity, part_name, min_stock_alert FROM inventory WHERE id=?", (item_id,))
    row = cur.fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Item not found")
    new_qty = max(0, row[0] - quantity)
    cur.execute("UPDATE inventory SET quantity=? WHERE id=?", (new_qty, item_id))
    con.commit()
    con.close()
    alert = new_qty <= row[2]
    return {"status":"updated","item_id":item_id,"new_quantity":new_qty,"low_stock_alert":alert,"item_name":row[1]}

@router.patch("/inventory/restock/{item_id}")
def restock_item(item_id: int, quantity: int = 1):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT quantity, part_name FROM inventory WHERE id=?", (item_id,))
    row = cur.fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Item not found")
    new_qty = row[0] + quantity
    cur.execute("UPDATE inventory SET quantity=? WHERE id=?", (new_qty, item_id))
    con.commit()
    con.close()
    return {"status":"updated","item_id":item_id,"new_quantity":new_qty,"item_name":row[1]}
