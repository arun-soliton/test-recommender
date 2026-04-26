from __future__ import annotations

import json
import os
from collections.abc import AsyncGenerator

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request
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


# ── Analyze ──────────────────────────────────────────────────────────────────

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


async def _analyze_generator(body: AnalyzeRequest) -> AsyncGenerator[str, None]:
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
        _analyze_generator(body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Notes ────────────────────────────────────────────────────────────────────

@app.get("/api/notes")
async def get_notes(
    project_name: str = Query(default=""),
    repo_name: str = Query(default=""),
    pr_id: int = Query(default=0),
) -> dict:
    notes_dir = os.getenv("NOTES_DIR", "notes")
    candidates = [
        f"{notes_dir}/{project_name}/{repo_name}/pr_{pr_id}.md",
        f"{notes_dir}/{project_name}/{repo_name}.md",
        f"{notes_dir}/{project_name}.md",
        f"{notes_dir}/default.md",
    ]
    for path in candidates:
        try:
            with open(path, encoding="utf-8") as fh:
                return {"content": fh.read()}
        except (FileNotFoundError, OSError):
            continue
    return {"content": ""}


# ── Chat ─────────────────────────────────────────────────────────────────────

class ChatMessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageItem]
    context: dict = {}


async def _chat_generator(
    messages: list[dict], context: dict
) -> AsyncGenerator[str, None]:
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

    project = context.get("project_name", "")
    repo = context.get("repo_name", "")
    pr_id = context.get("pr_id", "")

    system = (
        "You are a helpful AI assistant embedded in the Test Recommender tool. "
        f"The user is analyzing pull request #{pr_id} in the '{repo}' repository "
        f"of the '{project}' project. "
        "Answer questions about the PR analysis, test recommendations, and testing strategy concisely."
    )

    try:
        async with client.messages.stream(
            model=model,
            max_tokens=1024,
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'type': 'delta', 'text': text})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as exc:  # noqa: BLE001
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"


@app.post("/api/chat")
@limiter.limit("20/minute")
async def chat(request: Request, body: ChatRequest) -> StreamingResponse:
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    return StreamingResponse(
        _chat_generator(messages, body.context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
