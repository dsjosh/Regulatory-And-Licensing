import sqlite3
import os
import sys

def init_database():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, "database.db")
    data_file_path = os.path.join(script_dir, "load_db.txt")
    
    print(f"[*] Initialising process inside: {script_dir}")
    print(f"[*] Target database file destination: {db_path}")
    
    # Pre-check deletion
    if os.path.exists(db_path):
        print(f"[!] Warning: Existing database detected. Deleting for a clean slate...")
        try:
            os.remove(db_path)
            print("[+] Previous database file removed successfully.")
        except OSError as delete_err:
            print(f"[X] Critical Error: Could not delete existing database file: {delete_err}")
            sys.exit(1)
    
    conn = None
    success = False  # Track execution state
    
    try:
        print("[*] Connecting to SQLite and creating fresh database...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("[*] Applying structural DDL schema statements...")
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.execute("CREATE TABLE users (user_id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('officer','operator')),created_at TEXT DEFAULT CURRENT_TIMESTAMP);")
        cursor.execute("CREATE TABLE inspections (inspection_id INTEGER PRIMARY KEY AUTOINCREMENT,operator_email TEXT NOT NULL,officer_email TEXT NOT NULL,start_date TEXT NOT NULL,end_date TEXT,checklist_form_json TEXT DEFAULT '{}');")
        print("[+] Core tables and structural indices created successfully.")
        
        print(f"[*] Checking for data seed file at: {data_file_path}")
        if os.path.exists(data_file_path):
            print(f"[+] Found '{os.path.basename(data_file_path)}'. Injecting data...")
            with open(data_file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            statements_executed = 0
            for line_num, line in enumerate(lines, 1):
                clean_line = line.strip()
                if not clean_line or clean_line.startswith("--") or clean_line.startswith("#"):
                    continue
                
                try:
                    cursor.execute(clean_line)
                    statements_executed += 1
                except sqlite3.Error as statement_err:
                    print(f"[X] Critical Error on line {line_num}: '{clean_line}'")
                    print(f"[X] SQL Error Details: {statement_err}")
                    raise RuntimeError("Data seeding failed.")
            
            print(f"[+] Data loading complete. Ran {statements_executed} statements.")
        else:
            print(f"[-] Notice: '{os.path.basename(data_file_path)}' missing. Skipping data injection.")

        print("[*] Committing changes to disk...")
        conn.commit()
        print("[+] Operation finalized. Safe to exit.")
        success = True

    except (sqlite3.Error, RuntimeError, Exception) as err:
        print(f"\n[X] SCRIPT ABORTED: {err}")
        success = False
        
    finally:
        # 1. ALWAYS close the connection pipeline first to unlock the OS file handle
        if conn:
            try:
                conn.close()
                print("[*] Database connection closed.")
            except sqlite3.Error:
                pass
        
        # 2. Cleanup file ONLY if the operations failed
        if not success:
            if os.path.exists(db_path):
                print("[*] Cleaning up and deleting the incomplete database file...")
                try:
                    os.remove(db_path)
                    print("[+] Incomplete file removed successfully.")
                except OSError as e:
                    print(f"[X] Warning: Could not delete file: {e}")
            print("[X] Execution stopped.")
            sys.exit(1)

if __name__ == "__main__":
    init_database()
