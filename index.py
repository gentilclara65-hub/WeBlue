# Ponto de entrada para o deploy na Vercel.
# A aplicação continua em src/backend/app/main.py; localmente nada muda
# (python -m uvicorn backend.app.main:app --app-dir src).
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from backend.app.main import app  # noqa: E402,F401
