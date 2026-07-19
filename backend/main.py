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
from datetime import datetime
import json

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"
DATABASE_PATH = BASE_DIR / "backend" / "database.db"
config = configparser.ConfigParser()
config.read(BASE_DIR / "backend" / "env.txt")
SECRET_KEY = config["security"]["SECRET_KEY"]
serializer = URLSafeSerializer(SECRET_KEY)
EMPTY_INSPECTION_FORM = [{"1": {}, "2": {}, "3": {}, "4": {}, "5": {}}]
INSPECTION_QUESTIONS = {"1": "Is the electrical wiring colour coded to Singapore standards?","2": "Is the wire gauge suitable for the expected power draw?","3": "Are there fuses at every outlet?","4": "Is there any exposed wiring?","5": "Are high-voltage and low-voltage wiring separated?"}

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
    name: str  # Add this field
    email: str
    password: str
class ChangePasswordRequest(BaseModel):
    oldPassword:str
    newPassword:str
class NewInspectionRequest(BaseModel):
    operator_email: str
class InspectionAnswerRequest(BaseModel):
    update: str
    comment: str = ""
class SaveInspectionRequest(BaseModel):
    answers: dict[str, InspectionAnswerRequest]

app = FastAPI()

@app.post("/api/login")
def login(data: LoginRequest):
    if not data.email or not data.password:
        return {"success": False}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT password_hash, role, name FROM users WHERE email=?",(data.email,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return {"success": False}
    if not bcrypt.verify(data.password, row[0]):
        return {"success": False}
    response = JSONResponse({"success": True})
    token = serializer.dumps({"email": data.email, "role": row[1], "name": row[2]})
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
    cur.execute("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",(data.name,data.email,bcrypt.hash(data.password),"operator"))
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
    return {"loggedIn": True,"email": user["email"],"role": user["role"],"name": user["name"]}

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

@app.get("/api/officer/get-operators")
def search_operators(request: Request, query: str = ""):
    token = request.cookies.get("session")
    if not token: 
        return {"operators": []}
    user = serializer.loads(token)
    # Role validation: Ensure only officers can access this data
    if user.get("role") != "officer":
        return {"operators": []}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT email FROM users WHERE role = 'operator' AND email LIKE ?", ('%' + query + '%',))
    operators = [row[0] for row in cur.fetchall()]
    conn.close()
    return {"operators": operators}

@app.post("/api/officer/inspections/new")
def create_inspection(request: Request, data: NewInspectionRequest):
    token = request.cookies.get("session")
    if not token:
        return {"success": False}
    try:
        user = serializer.loads(token)
    except BadSignature:
        return {"success": False}
    if user.get("role") != "officer":
        return {"success": False}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM users WHERE email = ? AND role = 'operator'", (data.operator_email,))
    if not cur.fetchone():
        conn.close()
        return {"success": False, "error": "Invalid operator email."}
    cur.execute("SELECT 1 FROM inspections WHERE operator_email = ? AND end_date IS NULL", (data.operator_email,))
    if cur.fetchone():
        conn.close()
        return {"success": False, "error": "active inspection found. unable to create new one"}
    start_date = datetime.now().astimezone().isoformat()
    checklist_form_json = json.dumps(EMPTY_INSPECTION_FORM)
    cur.execute("INSERT INTO inspections (operator_email, officer_email, start_date, end_date, current_owner, checklist_form_json) VALUES (?, ?, ?, ?, ?, ?)", (data.operator_email, user["email"], start_date, None, "officer", checklist_form_json))
    inspection_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {"success": True, "inspection_id": inspection_id}

@app.get("/api/officer/inspections/in-progress")
def get_in_progress(request: Request):
    token = request.cookies.get("session")
    if not token:
        return {"inspections": [], "count": 0}
    try:
        user = serializer.loads(token)
    except BadSignature:
        return {"inspections": [], "count": 0}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT inspection_id, operator_email, start_date FROM inspections WHERE officer_email = ? AND end_date IS NULL", (user["email"],))
    results = [{"inspection_id": row[0], "operator_email": row[1], "start_date": row[2]} for row in cur.fetchall()]
    conn.close()
    return {"inspections": results, "count": len(results)}

@app.get("/api/officer/inspections/completed")
def get_completed(request: Request):
    token = request.cookies.get("session")
    if not token:
        return {"inspections": [], "count": 0}
    try:
        user = serializer.loads(token)
    except BadSignature:
        return {"inspections": [], "count": 0}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT inspection_id, operator_email, start_date, end_date FROM inspections WHERE officer_email = ? AND end_date IS NOT NULL", (user["email"],))
    results = [{"inspection_id": row[0], "operator_email": row[1], "start_date": row[2], "end_date": row[3]} for row in cur.fetchall()]
    conn.close()
    return {"inspections": results, "count": len(results)}

@app.get("/api/operator/inspections/in-progress")
def get_operator_in_progress(request: Request):
    token = request.cookies.get("session")
    if not token:
        return {"inspections": [], "count": 0}
    try:
        user = serializer.loads(token)
    except BadSignature:
        return {"inspections": [], "count": 0}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT inspection_id, officer_email, start_date FROM inspections WHERE operator_email = ? AND end_date IS NULL", (user["email"],))
    results = [{"inspection_id": row[0], "officer_email": row[1], "start_date": row[2]} for row in cur.fetchall()]
    conn.close()
    return {"inspections": results, "count": len(results)}

@app.get("/api/operator/inspections/completed")
def get_operator_completed(request: Request):
    token = request.cookies.get("session")
    if not token:
        return {"inspections": [], "count": 0}
    try:
        user = serializer.loads(token)
    except BadSignature:
        return {"inspections": [], "count": 0}
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT inspection_id, officer_email, start_date, end_date FROM inspections WHERE operator_email = ? AND end_date IS NOT NULL", (user["email"],))
    results = [{"inspection_id": row[0], "officer_email": row[1], "start_date": row[2], "end_date": row[3]} for row in cur.fetchall()]
    conn.close()
    return {"inspections": results, "count": len(results)}

@app.get("/api/inspection/{inspection_id}")
def get_inspection(inspection_id: int, request: Request):
    token = request.cookies.get("session")
    if not token:
        return JSONResponse({"success": False, "error": "Not logged in"}, status_code=401)
    try:
        user = serializer.loads(token)
    except BadSignature:
        return JSONResponse({"success": False, "error": "Invalid session"}, status_code=401)
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT inspection_id, operator_email, officer_email, start_date, end_date, current_owner, checklist_form_json FROM inspections WHERE inspection_id = ?", (inspection_id,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return JSONResponse({"success": False, "error": "Inspection not found"}, status_code=404)
    if user["email"] != row[1] and user["email"] != row[2]:
        return JSONResponse({"success": False, "error": "Access denied"}, status_code=403)
    try:
        audit_log = json.loads(row[6])
    except (json.JSONDecodeError, TypeError):
        audit_log = EMPTY_INSPECTION_FORM
    if not isinstance(audit_log, list) or len(audit_log) == 0:
        audit_log = EMPTY_INSPECTION_FORM
    latest = audit_log[-1]
    is_complete = row[4] is not None
    if user["role"] == "operator" and not is_complete:
        if row[5] == "operator":
            visible_question_ids = [question_id for question_id in INSPECTION_QUESTIONS if isinstance(latest.get(question_id), dict) and latest.get(question_id, {}).get("update") == "pending"]
            visible_audit_log = [{question_id: entry.get(question_id, {}) for question_id in visible_question_ids} for entry in audit_log]
            visible_questions = {question_id: INSPECTION_QUESTIONS[question_id] for question_id in visible_question_ids}
            visible_latest = {question_id: latest.get(question_id, {}) for question_id in visible_question_ids}
        else:
            visible_audit_log = []
            visible_questions = {}
            visible_latest = {}
    else:
        visible_audit_log = audit_log
        visible_questions = INSPECTION_QUESTIONS
        visible_latest = latest
    return {"success": True, "inspection": {"inspection_id": row[0], "operator_email": row[1], "officer_email": row[2], "start_date": row[3], "end_date": row[4], "current_owner": row[5], "role": user["role"], "can_edit": row[4] is None and row[5] == user["role"], "questions": visible_questions, "latest": visible_latest, "audit_log": visible_audit_log}}

@app.post("/api/inspection/{inspection_id}")
def save_inspection(inspection_id: int, request: Request, data: SaveInspectionRequest):
    token = request.cookies.get("session")
    if not token:
        return JSONResponse({"success": False, "error": "Not logged in"}, status_code=401)
    try:
        user = serializer.loads(token)
    except BadSignature:
        return JSONResponse({"success": False, "error": "Invalid session"}, status_code=401)
    conn = sqlite3.connect(DATABASE_PATH)
    cur = conn.cursor()
    cur.execute("SELECT operator_email, officer_email, end_date, current_owner, checklist_form_json FROM inspections WHERE inspection_id = ?", (inspection_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        return JSONResponse({"success": False, "error": "Inspection not found"}, status_code=404)
    if user["email"] != row[0] and user["email"] != row[1]:
        conn.close()
        return JSONResponse({"success": False, "error": "Access denied"}, status_code=403)
    if row[2] is not None:
        conn.close()
        return JSONResponse({"success": False, "error": "Inspection is already complete"}, status_code=400)
    if row[3] != user["role"]:
        conn.close()
        return JSONResponse({"success": False, "error": "This inspection is not pending your action"}, status_code=403)
    try:
        audit_log = json.loads(row[4])
    except (json.JSONDecodeError, TypeError):
        audit_log = EMPTY_INSPECTION_FORM
    if not isinstance(audit_log, list) or len(audit_log) == 0:
        audit_log = EMPTY_INSPECTION_FORM
    previous = audit_log[-1]
    latest = json.loads(json.dumps(previous))
    changed = False
    now = datetime.now().astimezone().isoformat()
    for question_id, answer in data.answers.items():
        if question_id not in INSPECTION_QUESTIONS:
            continue
        requested_update = answer.update.strip().lower()
        comment = answer.comment.strip()
        previous_answer = previous.get(question_id, {})
        if not isinstance(previous_answer, dict):
            previous_answer = {}
        if user["role"] == "officer":
            if not requested_update:
                continue
            if requested_update not in ("pass", "fail", "pending"):
                conn.close()
                return JSONResponse({"success": False, "error": "Invalid update value"}, status_code=400)
            update = requested_update
        else:
            if previous_answer.get("update") != "pending":
                conn.close()
                return JSONResponse({"success": False, "error": "Operator can only respond to pending questions"}, status_code=403)
            if requested_update != "pending":
                conn.close()
                return JSONResponse({"success": False, "error": "Operator cannot change the pending status"}, status_code=400)
            update = "pending"
        if previous_answer.get("update") == update and previous_answer.get("comment", "") == comment and previous_answer.get("updated_by") == user["role"]:
            continue
        latest[question_id] = {"updated_by": user["role"], "update": update, "comment": comment, "date": now}
        changed = True
    if not changed:
        conn.close()
        return JSONResponse({"success": False, "error": "you cant save/submit a blank form"}, status_code=400)
    audit_log.append(latest)
    end_date = None
    if user["role"] == "officer":
        has_blank = any(not isinstance(latest.get(question_id), dict) or len(latest.get(question_id, {})) == 0 for question_id in INSPECTION_QUESTIONS)
        has_pending = any(isinstance(latest.get(question_id), dict) and latest.get(question_id, {}).get("update") == "pending" for question_id in INSPECTION_QUESTIONS)
        if has_blank:
            new_owner = "officer"
        elif has_pending:
            new_owner = "operator"
        else:
            new_owner = None
            end_date = datetime.now().astimezone().isoformat()
    else:
        pending_question_ids = [question_id for question_id in INSPECTION_QUESTIONS if isinstance(previous.get(question_id), dict) and previous.get(question_id, {}).get("update") == "pending"]
        operator_responded_to_all = all(isinstance(latest.get(question_id), dict) and latest.get(question_id, {}).get("update") == "pending" and latest.get(question_id, {}).get("updated_by") == "operator" for question_id in pending_question_ids)
        new_owner = "officer" if operator_responded_to_all else "operator"
    cur.execute("UPDATE inspections SET checklist_form_json = ?, current_owner = ?, end_date = ? WHERE inspection_id = ?", (json.dumps(audit_log), new_owner, end_date, inspection_id))
    conn.commit()
    conn.close()
    return {"success": True, "current_owner": new_owner, "end_date": end_date}

#the order for the below route is important, it should be the last one to avoid conflicts with other routes
@app.get("/{path:path}")
async def serve_react_app(path: str):
    file_path = DIST_DIR / path
    if path and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(DIST_DIR / "index.html")

uvicorn.run(app,host="0.0.0.0",port=8000,reload=False)
