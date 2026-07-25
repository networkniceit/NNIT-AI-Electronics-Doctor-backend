from fastapi import APIRouter
from services.db import q_enterprise

router = APIRouter()


@router.get("/reports/revenue")
def revenue_report():
    by_status_rows = q_enterprise("SELECT status, COUNT(*) as count, SUM(total) as total FROM invoices GROUP BY status", fetch=True) or []
    by_status = [{"status": r["status"], "count": r["count"], "total": round(r["total"] or 0, 2)} for r in by_status_rows]

    paid = q_enterprise("SELECT SUM(total) as total FROM invoices WHERE status='Paid'", fetch=True)
    pending = q_enterprise("SELECT SUM(total) as total FROM invoices WHERE status IN ('Draft','Sent')", fetch=True)
    overdue = q_enterprise("SELECT SUM(total) as total FROM invoices WHERE status='Overdue'", fetch=True)
    count_result = q_enterprise("SELECT COUNT(*) as count FROM invoices", fetch=True)

    total_revenue = round((paid[0]["total"] if paid and paid[0]["total"] else 0), 2)
    pending_revenue = round((pending[0]["total"] if pending and pending[0]["total"] else 0), 2)
    overdue_revenue = round((overdue[0]["total"] if overdue and overdue[0]["total"] else 0), 2)
    total_invoices = count_result[0]["count"] if count_result else 0

    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "overdue_revenue": overdue_revenue,
        "total_invoices": total_invoices,
        "by_status": by_status,
    }


@router.get("/reports/tickets")
def ticket_report():
    by_status_rows = q_enterprise("SELECT status, COUNT(*) as count FROM tickets GROUP BY status", fetch=True) or []
    by_status = [{"status": r["status"], "count": r["count"]} for r in by_status_rows]

    top_devices_rows = q_enterprise(
        "SELECT device_brand, COUNT(*) as count FROM tickets GROUP BY device_brand ORDER BY COUNT(*) DESC LIMIT 10",
        fetch=True
    ) or []
    top_devices = [{"device": r["device_brand"], "count": r["count"]} for r in top_devices_rows]

    count_result = q_enterprise("SELECT COUNT(*) as count FROM tickets", fetch=True)
    total = count_result[0]["count"] if count_result else 0

    return {"total_tickets": total, "by_status": by_status, "top_devices": top_devices}


@router.get("/reports/inventory")
def inventory_report():
    summary = q_enterprise(
        "SELECT COUNT(*) as count, SUM(quantity) as units, SUM(quantity*unit_cost) as value FROM inventory",
        fetch=True
    )
    row = summary[0] if summary else {"count": 0, "units": 0, "value": 0}

    low_stock_rows = q_enterprise(
        "SELECT part_name, quantity, min_stock_alert FROM inventory WHERE quantity<=min_stock_alert",
        fetch=True
    ) or []
    low_stock = [{"name": r["part_name"], "quantity": r["quantity"], "min": r["min_stock_alert"]} for r in low_stock_rows]

    by_category_rows = q_enterprise(
        "SELECT category, COUNT(*) as items, SUM(quantity) as units FROM inventory GROUP BY category",
        fetch=True
    ) or []
    by_category = [{"category": r["category"], "items": r["items"], "units": r["units"]} for r in by_category_rows]

    return {
        "total_items": row["count"] or 0,
        "total_units": row["units"] or 0,
        "stock_value": round(row["value"] or 0, 2),
        "low_stock": low_stock,
        "by_category": by_category,
    }


@router.get("/reports/dashboard")
def dashboard_report():
    customers = q_enterprise("SELECT COUNT(*) as count FROM customers", fetch=True)
    tickets = q_enterprise("SELECT COUNT(*) as count FROM tickets", fetch=True)
    invoices = q_enterprise("SELECT COUNT(*) as count FROM invoices", fetch=True)
    revenue_result = q_enterprise("SELECT SUM(total) as total FROM invoices WHERE status='Paid'", fetch=True)
    low_stock_result = q_enterprise("SELECT COUNT(*) as count FROM inventory WHERE quantity<=min_stock_alert", fetch=True)

    return {
        "customers": customers[0]["count"] if customers else 0,
        "tickets": tickets[0]["count"] if tickets else 0,
        "invoices": invoices[0]["count"] if invoices else 0,
        "revenue": round((revenue_result[0]["total"] if revenue_result and revenue_result[0]["total"] else 0), 2),
        "low_stock_alerts": low_stock_result[0]["count"] if low_stock_result else 0,
    }