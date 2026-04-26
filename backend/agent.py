from __future__ import annotations

import json
import os
import time
from collections.abc import AsyncGenerator
from typing import Any

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    SystemMessage,
    TextBlock,
    query,
)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
AGENT_TIMEOUT = 300  # seconds

# Built-in Claude Agent SDK tool names — anything else is treated as a custom MCP tool
_SDK_BUILTINS = {
    "Read", "Write", "Edit", "Bash", "Glob", "Grep",
    "WebSearch", "WebFetch", "AskUserQuestion", "Agent", "Monitor",
}


def _tool_type(tool_name: str) -> str:
    return "builtin" if tool_name in _SDK_BUILTINS else "custom"


def _build_prompt(project_name: str, repo_name: str, pull_request_id: int) -> str:
    return f"""You are a test recommendation agent for the project "{project_name}".

Your task is to analyze Pull Request #{pull_request_id} in the repository "{repo_name}"
and recommend a comprehensive set of test cases.

Use the available tools to gather information about the pull request, then apply the
test-case-recommender skill to analyze the changes.

Your final response must be ONLY a valid JSON array of strings with no other text.
Each string should start with "Verify that" or "Test that" and describe one specific test scenario.

Example format:
["Verify that ...", "Test that ...", "Verify that ..."]"""


def _extract_test_cases(raw: str) -> list[str]:
    """Extract a JSON array of strings from the agent result, ignoring surrounding prose."""
    # Strip markdown code fences first
    if "```" in raw:
        lines = raw.splitlines()
        raw = "\n".join(l for l in lines if not l.startswith("```")).strip()

    # Try direct JSON parse
    try:
        result = json.loads(raw)
        if isinstance(result, list):
            return [str(i).strip() for i in result if str(i).strip()]
    except json.JSONDecodeError:
        pass

    # Extract the first [...] block from the text (handles reasoning prose around the array)
    start = raw.find("[")
    end = raw.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            result = json.loads(raw[start : end + 1])
            if isinstance(result, list):
                return [str(i).strip() for i in result if str(i).strip()]
        except json.JSONDecodeError:
            pass

    # Last resort: treat non-empty lines that look like test case sentences as items
    return [
        line.strip().strip('"').strip("'").strip("-").strip()
        for line in raw.splitlines()
        if line.strip() and len(line.strip()) > 10
    ]


async def run_agent(
    project_name: str,
    repo_name: str,
    pull_request_id: int,
) -> AsyncGenerator[dict[str, Any], None]:
    """Async generator that yields SSE event dicts."""
    session_id: str | None = None
    start = time.monotonic()

    try:
        async for message in query(
            prompt=_build_prompt(project_name, repo_name, pull_request_id),
            options=ClaudeAgentOptions(
                cwd=BACKEND_DIR,
                permission_mode="acceptEdits",
            ),
        ):
            if time.monotonic() - start > AGENT_TIMEOUT:
                yield {"type": "error", "data": {"message": "Agent timed out after 5 minutes"}}
                return

            if isinstance(message, SystemMessage) and message.subtype == "init":
                session_id = message.data.get("session_id")
                yield {"type": "session_start", "data": {"session_id": session_id or ""}}

            elif isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock) and block.text.strip():
                        yield {"type": "thinking", "data": {"text": block.text}}

                    elif hasattr(block, "name") and hasattr(block, "input"):
                        yield {
                            "type": "tool_use",
                            "data": {
                                "tool_name": block.name,
                                "tool_type": _tool_type(block.name),
                                "input_summary": json.dumps(block.input, default=str)[:300],
                            },
                        }

                    elif hasattr(block, "tool_use_id") and hasattr(block, "content"):
                        content = block.content
                        if isinstance(content, list):
                            output = " ".join(getattr(b, "text", str(b)) for b in content)
                        else:
                            output = str(content)
                        yield {
                            "type": "tool_result",
                            "data": {"output_summary": output[:400]},
                        }

            elif isinstance(message, ResultMessage):
                session_id = message.session_id
                if message.subtype == "success":
                    raw = (message.result or "").strip()
                    test_cases = _extract_test_cases(raw)
                    yield {
                        "type": "test_cases",
                        "data": {
                            "test_cases": test_cases,
                            "summary": {
                                "total_tests": len(test_cases),
                                "pr_scope": f"PR #{pull_request_id} in {repo_name}",
                            },
                        },
                    }
                else:
                    yield {"type": "error", "data": {"message": f"Agent ended with: {message.subtype}"}}

    except Exception as exc:
        yield {"type": "error", "data": {"message": str(exc)}}

    finally:
        yield {"type": "done", "data": {"session_id": session_id or ""}}
