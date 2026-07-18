from pathlib import Path
import shutil
import subprocess
import sys
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"

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

app = FastAPI()
@app.get("/api/hello")
def hello():
    return {"message": "Hello"}
app.mount("/",StaticFiles(directory=DIST_DIR, html=True),name="frontend")
uvicorn.run(app,host="0.0.0.0",port=8000,reload=False)
