from fastapi import APIRouter
import sqlite3
from datetime import datetime, timedelta

router = APIRouter()
DB = "nnit_doctor.db"

@router.get("/reports/revenue")
def revenue_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT status, COUNT(*), SUM(total) FROM invoices GROUP BY status")
    by_status = [{"status":r[0],"count":r[1],"total":round(r[2] or 0,2)} for r in cur.fetchall()]
    cur.execute("SELECT SUM(total) FROM invoices WHERE status='Paid'")
    total_revenue = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT SUM(total) FROM invoices WHERE status IN ('Draft','Sent')")
    pending = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT SUM(total) FROM invoices WHERE status='Overdue'")
    overdue = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT COUNT(*) FROM invoices")
    total_invoices = cur.fetchone()[0]
    con.close()
    return {"total_revenue":total_revenue,"pending_revenue":pending,"overdue_revenue":overdue,"total_invoices":total_invoices,"by_status":by_status}

@router.get("/reports/tickets")
def ticket_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT status, COUNT(*) FROM tickets GROUP BY status")
    by_status = [{"status":r[0],"count":r[1]} for r in cur.fetchall()]
    cur.execute("SELECT device_brand, COUNT(*) FROM tickets GROUP BY device_brand ORDER BY COUNT(*) DESC LIMIT 10")
    top_devices = [{"device":r[0],"count":r[1]} for r in cur.fetchall()]
    cur.execute("SELECT COUNT(*) FROM tickets")
    total = cur.fetchone()[0]
    con.close()
    return {"total_tickets":total,"by_status":by_status,"top_devices":top_devices}

@router.get("/reports/inventory")
def inventory_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*), SUM(quantity), SUM(quantity*unit_cost) FROM inventory")
    r = cur.fetchone()
    cur.execute("SELECT part_name,quantity,min_stock_alert FROM inventory WHERE quantity<=min_stock_alert")
    low_stock = [{"name":r[0],"quantity":r[1],"min":r[2]} for r in cur.fetchall()]
    cur.execute("SELECT category, COUNT(*), SUM(quantity) FROM inventory GROUP BY category")
    by_category = [{"category":r[0],"items":r[1],"units":r[2]} for r in cur.fetchall()]
    con.close()
    return {"total_items":r[0],"total_units":r[1],"stock_value":round(r[2] or 0,2),"low_stock":low_stock,"by_category":by_category}

@router.get("/reports/dashboard")
def dashboard_report():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM customers")
    customers = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM tickets")
    tickets = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM invoices")
    invoices = cur.fetchone()[0]
    cur.execute("SELECT SUM(total) FROM invoices WHERE status='Paid'")
    revenue = round((cur.fetchone()[0] or 0),2)
    cur.execute("SELECT COUNT(*) FROM inventory WHERE quantity<=min_stock_alert")
    low_stock = cur.fetchone()[0]
    con.close()
    return {"customers":customers,"tickets":tickets,"invoices":invoices,"revenue":revenue,"low_stock_alerts":low_stock}
