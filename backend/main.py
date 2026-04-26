from __future__ import annotations

import json
import os
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from agent import run_agent

load_dotenv()

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Test Recommender API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    project_name: str
    repo_name: str
    pull_request_id: int

    @field_validator("pull_request_id")
    @classmethod
    def validate_pr_id(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("pull_request_id must be a positive integer")
        return v


async def _event_generator(body: AnalyzeRequest) -> AsyncGenerator[str, None]:
    async for event in run_agent(
        body.project_name,
        body.repo_name,
        body.pull_request_id,
    ):
        yield f"data: {json.dumps(event)}\n\n"


@app.post("/api/analyze")
@limiter.limit("10/minute")
async def analyze(request: Request, body: AnalyzeRequest) -> StreamingResponse:
    return StreamingResponse(
        _event_generator(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
