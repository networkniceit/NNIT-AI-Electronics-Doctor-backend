import sqlite3, os
DB=os.path.join(os.path.dirname(os.path.dirname(__file__)),"doctor.db")
def q(sql,p=(),fetch=False):
    con=sqlite3.connect(DB); cur=con.cursor(); cur.execute(sql,p); con.commit()
    data=cur.fetchall() if fetch else None
    con.close(); return data
def init():
    q("CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,phone TEXT,email TEXT)")
    q("CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY AUTOINCREMENT,customer TEXT,device TEXT,fault TEXT,status TEXT DEFAULT 'new')")
    q("CREATE TABLE IF NOT EXISTS inventory(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,qty INTEGER,price REAL)")
init()
