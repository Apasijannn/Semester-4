"""Entry point FastAPI — Karsa AI Planner (Fase 1).

Jalankan dari folder backend/:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI

from app.routers import planner

app = FastAPI(
    title="Karsa — AI Planner API",
    description="Backend modul AI Planner: Prompt A (Extraction) via Gemini structured output.",
    version="0.1.0",
)

app.include_router(planner.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
