#!/usr/bin/env python3
"""
NIRIKSHAN Unified AI Service — Startup Script
Runs the unified FastAPI app from apps/ai-service/app/main.py on port 8000.

Usage:
  python start_ai.py
  python start_ai.py --port 8000 --reload
"""

import subprocess
import sys
import os
from pathlib import Path

AI_SERVICE_DIR = Path(__file__).resolve().parent / "apps" / "ai-service"
APP_MODULE     = "app.main:app"

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Start NIRIKSHAN Unified AI Service")
    parser.add_argument("--port",   type=int,  default=8008,  help="Port to listen on (default: 8008)")
    parser.add_argument("--host",   type=str,  default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable hot-reload (development only)")
    args = parser.parse_args()

    os.chdir(AI_SERVICE_DIR)

    cmd = [
        sys.executable, "-m", "uvicorn",
        APP_MODULE,
        "--host", args.host,
        "--port", str(args.port),
    ]
    if args.reload:
        cmd.append("--reload")

    print("")
    print("  [AI] NIRIKSHAN Unified AI Service")
    print("  ------------------------------------------------------")
    print(f"  * Endpoint  : http://{args.host}:{args.port}")
    print(f"  * Health    : http://{args.host}:{args.port}/health")
    print(f"  * API Docs  : http://{args.host}:{args.port}/docs")
    print("  ------------------------------------------------------")
    print("  Capabilities:")
    print("    * /api/v1/analyze/*      -> Anomaly analytics")
    print("    * /api/v1/face/*         -> Face detection & deduplication")
    print("    * /api/v1/integrity/*    -> Beneficiary data-integrity rules")
    print("  ------------------------------------------------------")
    print("")

    subprocess.run(cmd, cwd=AI_SERVICE_DIR, check=True)

if __name__ == "__main__":
    main()
