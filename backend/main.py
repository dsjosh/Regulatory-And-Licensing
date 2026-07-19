from pathlib import Path
import shutil
import subprocess
import sys
from fastapi import FastAPI,Response, Request
from fastapi.responses import JSONResponse
from itsdangerous import URLSafeSerializer, BadSignature
import uvicorn
from passlib.hash import bcrypt
from pydantic import BaseModel
import sqlite3
import configparser
from fastapi.responses import FileResponse
import os

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"
DATABASE_PATH = BASE_DIR / "backend" / "database.db"
config = configparser.ConfigParser()
config.read(BASE_DIR / "backend" / "env.txt")
SECRET_KEY = config["security"]["SECRET_KEY"]
serializer = URLSafeSerializer(SECRET_KEY)

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
class ChangePasswordRequest(BaseModel):
    oldPassword:str
    newPassword:str

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
    response = JSONResponse({"success": True})
    token = serializer.dumps({"email": data.email,"role": row[1]})
    response.set_cookie(key="session",value=token,httponly=True,samesite="lax")
    return response

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

@app.post("/api/logout")
def logout():
    response = JSONResponse({"success": True})
    response.delete_cookie("session")
    return response

@app.get("/api/session")
def session(request: Request):
    token = request.cookies.get("session")
    if token is None:
        return {"loggedIn": False}
    try:
        user = serializer.loads(token)
    except BadSignature:
        return {"loggedIn": False}
    return {"loggedIn": True,"email": user["email"],"role": user["role"]}

@app.post("/api/change-password")
def change_password(request:Request,data:ChangePasswordRequest):
    token=request.cookies.get("session")
    if token is None:
        return {"success":False}
    try:
        user=serializer.loads(token)
    except BadSignature:
        return {"success":False}
    conn=sqlite3.connect(DATABASE_PATH)
    cur=conn.cursor()
    cur.execute("SELECT password_hash FROM users WHERE email=?",(user["email"],))
    row=cur.fetchone()
    if row is None:
        conn.close()
        return {"success":False}
    if not bcrypt.verify(data.oldPassword,row[0]):
        conn.close()
        return {"success":False}
    cur.execute("UPDATE users SET password_hash=? WHERE email=?",(bcrypt.hash(data.newPassword),user["email"]))
    conn.commit()
    conn.close()
    return {"success":True}

@app.get("/{path:path}")
async def serve_react_app(path: str):
    file_path = DIST_DIR / path
    if path and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(DIST_DIR / "index.html")

uvicorn.run(app,host="0.0.0.0",port=8000,reload=False)
