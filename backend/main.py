from pathlib import Path
import shutil
import subprocess
import sys
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
from passlib.hash import bcrypt
from pydantic import BaseModel
import sqlite3

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"
DATABASE_PATH = BASE_DIR / "backend" / "database.db"

startup_choice = input("Rebuild React frontend? (y/n): ").strip().lower()

if startup_choice == "y":
    if DIST_DIR.exists():
        print("Deleting previous build...")
        shutil.rmtree(DIST_DIR)
    print("Building React...")
    result = subprocess.run([r"C:\Program Files\nodejs\npm.cmd", "run", "build"],cwd=FRONTEND_DIR)
    if result.returncode != 0:
        print("React build failed.")
        sys.exit(1)

if not DIST_DIR.exists():
    print("React build not found.\nExpected folder: "+DIST_DIR+"\nChoose 'y' to build the frontend first.")
    sys.exit(1)

class LoginRequest(BaseModel):
    email: str
    password: str
class RegisterRequest(BaseModel):
    email: str
    password: str

app = FastAPI()

@app.post("/api/login")
def login(data: LoginRequest):
    if not data.email or not data.password:
        return {"success": False}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT password_hash, role FROM users WHERE email=?",(data.email,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return {"success": False}
    if not bcrypt.verify(data.password, row[0]):
        return {"success": False}
    return {"success": True,"role": row[1]}

@app.post("/api/register")
def register(data: RegisterRequest):
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM users WHERE email=?",(data.email,))
    if cur.fetchone():
        conn.close()
        return {"success": False}
    cur.execute("INSERT INTO users(email,password_hash,role) VALUES(?,?,?)",(data.email,bcrypt.hash(data.password),"operator"))
    conn.commit()
    conn.close()
    return {"success": True}

app.mount("/",StaticFiles(directory=DIST_DIR, html=True),name="frontend")
uvicorn.run(app,host="0.0.0.0",port=8000,reload=False)
