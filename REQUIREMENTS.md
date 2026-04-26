# Test Recommendation System — Requirements Document

## 1. Overview

A web application that analyzes a GitHub Pull Request using a Claude Agent SDK agent and recommends test cases. The agent's reasoning is streamed live to the user so they can follow along and intervene if needed. Finalized test cases are displayed in a structured, reviewable format.

---

## 2. Goals

- Allow developers to get AI-generated test case recommendations for any PR without leaving the browser.
- Make the AI reasoning process transparent and inspectable, not a black box.
- Give users an easy way to review, accept, or flag recommended tests.

---

## 3. Tech Stack

| Layer        | Technology                                                  |
|--------------|-------------------------------------------------------------|
| Frontend     | React (TypeScript)                                          |
| Backend      | Python + FastAPI                                            |
| AI Agent     | Claude Agent SDK (`claude-agent-sdk` Python package)        |
| Model        | `claude-sonnet-4-6` (default) or `claude-opus-4-7`          |
| Streaming    | Server-Sent Events (SSE)                                    |
| GitHub       | Stub functions (placeholder implementation provided by user) |
| Custom Tools | MCP server exposing GitHub stub functions as agent tools    |
| Skills       | Agent SDK skills (`.claude/skills/`) for reusable logic     |

---

## 4. User Flow

1. User opens the app and sees an input form.
2. User enters:
   - **Project Name** (display label / context hint for the agent)
   - **Repository Name** (e.g. `owner/repo`)
   - **Pull Request ID** (integer)
3. User clicks **"Analyze PR"**.
4. The app transitions to a results view with two tabs:
   - **Thinking Stream** tab (active by default) — live stream of the agent's reasoning.
   - **Test Cases** tab — populated once the agent finishes.
5. On the Thinking Stream tab:
   - Each reasoning step appears incrementally as it streams in.
   - A status indicator shows: `Analyzing…` → `Done` or `Error`.
6. On the Test Cases tab:
   - Recommended test cases are listed.
   - Each test case has a thumbs-up / thumbs-down feedback control.
   - A summary section at the top shows: total tests recommended, coverage areas identified, key risks flagged.
7. User can click **"New Analysis"** to reset and start over.

---

## 5. Backend Requirements

### 5.1 API Endpoints

#### `POST /api/analyze`
Accepts the user's input and returns a streaming SSE response.

**Request body:**
```json
{
  "project_name": "string",
  "repo_name": "string",        // format: "owner/repo"
  "pull_request_id": 123
}
```

**Response:** `text/event-stream` (SSE)

SSE event types:
| Event type       | Payload description                                          |
|------------------|--------------------------------------------------------------|
| `session_start`  | `{ session_id }` — emitted at the start of every agent run  |
| `thinking`       | Incremental assistant text as the agent reasons              |
| `tool_use`       | Agent invoking a built-in tool (name + input summary)        |
| `tool_result`    | Result returned from a tool call                             |
| `test_cases`     | Final JSON array of recommended test cases                   |
| `summary`        | Final summary object                                         |
| `error`          | Error message string (maps to SDK `error_*` subtypes)        |
| `done`           | `{ session_id }` — stream end signal, ID for future resume   |

#### `GET /api/health`
Returns `{ "status": "ok" }`. Used for liveness checks.

---

### 5.2 Agent Design

#### SDK Usage

Install via: `pip install claude-agent-sdk`

The agent is invoked using the SDK's `query()` async generator. The SDK owns the entire agent loop — tool selection, execution, and iteration.

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt=build_prompt(project_name, repo_name, pull_request_id),
    options=ClaudeAgentOptions(
        allowed_tools=["get_pr_details", "get_pr_diff", "get_pr_files", "get_pr_comments"],
        mcp_servers={"github-tools": {"command": "python", "args": ["mcp_server.py"]}},
        permission_mode="acceptEdits",
    ),
):
    # forward message as SSE event
```

#### Custom Tools (GitHub Stubs)

GitHub integration is implemented as **stub functions** — the user has a base implementation that will be slotted in. These stubs are exposed to the agent as custom tools via a lightweight MCP server (`mcp_server.py`):

| Custom Tool        | Stub behaviour                                               |
|--------------------|--------------------------------------------------------------|
| `get_pr_details`   | Returns hardcoded PR title, description, author, branches    |
| `get_pr_diff`      | Returns a hardcoded unified diff string                      |
| `get_pr_files`     | Returns a hardcoded list of changed file paths               |
| `get_pr_comments`  | Returns a hardcoded list of review comment strings           |

When the real GitHub integration is ready, only the stub implementations need to change — the tool names, MCP wiring, and agent prompt stay the same.

#### Skills

Agent SDK skills (Markdown files in `.claude/skills/`) encode reusable analysis logic. The following skill will be defined:

| Skill                  | Purpose                                                          |
|------------------------|------------------------------------------------------------------|
| `test-case-recommender`| Guides the agent on how to analyze a diff and produce test cases |

Skills are loaded automatically by the SDK from `.claude/skills/` and can be referenced in the agent prompt.

#### Agent Prompt

The prompt passed to `query()` will:
- Provide `project_name`, `repo_name`, `pull_request_id` as context.
- Instruct the agent to call the custom tools to gather PR data.
- Reference the `test-case-recommender` skill for analysis guidance.
- Instruct it to output a plain list of test case strings (see §5.3) as its final result.

#### Message Types & SSE Mapping

The `query()` generator yields strongly-typed message objects. Each is forwarded as an SSE event:

| SDK Message Type   | Condition                        | SSE Event type  | Payload                                        |
|--------------------|----------------------------------|-----------------|------------------------------------------------|
| `SystemMessage`    | `subtype == "init"`              | `session_start` | `{ session_id }`                               |
| `AssistantMessage` | Contains `TextBlock`             | `thinking`      | Incremental assistant text                     |
| `AssistantMessage` | Contains tool-use block          | `tool_use`      | `{ tool_name, tool_type, input_summary }`      |
| `AssistantMessage` | Contains tool-result block       | `tool_result`   | `{ tool_name, tool_type, output_summary }`     |
| `AssistantMessage` | Skill invocation detected        | `skill_use`     | `{ skill_name, description }`                  |
| `ResultMessage`    | `subtype == "success"`           | `test_cases`    | JSON array of strings from `message.result`    |
| `ResultMessage`    | `subtype == "error_*"`           | `error`         | `message.subtype` + error detail               |
| _(stream end)_     | After last message               | `done`          | `{ session_id }`                               |

`tool_type` distinguishes what is shown in the UI: `"custom"` for MCP tools (GitHub stubs), `"skill"` for skill invocations, `"builtin"` for any SDK built-in tools.

#### Sessions

- The `session_id` is captured from `ResultMessage.session_id` at the end of each run.
- It is returned to the frontend as part of the `done` SSE event payload so the client can store it.
- A separate `POST /api/analyze/resume` endpoint (v1.1) will accept a `session_id` to resume a prior analysis with a follow-up prompt, using `ClaudeAgentOptions(resume=session_id)`.
- Sessions are persisted to disk by the SDK automatically under `~/.claude/projects/`.

---

### 5.3 Output Schema

**Test cases** — a plain JSON array of strings. Each string is one complete test case description:

```json
[
  "Verify that login fails with an invalid password and returns HTTP 401",
  "Verify that login succeeds with valid credentials and returns a JWT token",
  "Verify that expired tokens are rejected with HTTP 403"
]
```

**Summary object** — derived by the backend from the test case list before emitting the `test_cases` SSE event:

```json
{
  "total_tests": 3,
  "pr_scope": "string — one-line description of what the PR changes"
}
```

---

### 5.4 Configuration (Environment Variables)

| Variable              | Description                                 |
|-----------------------|---------------------------------------------|
| `ANTHROPIC_API_KEY`   | Claude API key                              |
| `GITHUB_TOKEN`        | GitHub personal access token (read-only)    |
| `CLAUDE_MODEL`        | Model ID (default: `claude-sonnet-4-6`)     |
| `ALLOWED_ORIGINS`     | Comma-separated CORS origins for FastAPI    |

---

## 6. Frontend Requirements

### 6.1 Pages / Views

#### Input Form (Home)
- Three input fields: Project Name, Repository Name, Pull Request ID.
- Validation: all fields required; PR ID must be a positive integer; repo name must match `owner/repo` format.
- "Analyze PR" button — disabled while a request is in flight.
- Clear error display for validation and API errors.

#### Results View
- **Tab 1 — Thinking Stream**
  - Scrollable, auto-scrolling panel showing streamed events in order.
  - Distinct visual styles per event type:
    - `thinking` — plain text, subdued colour (agent reasoning)
    - `tool_use` (custom) — highlighted chip showing custom tool name + input summary
    - `tool_use` (builtin) — different chip style for SDK built-in tools
    - `skill_use` — distinct badge showing skill name
    - `tool_result` — collapsible block showing truncated output
  - Status badge: `Analyzing…` (animated) → `Complete` → `Error`.
  - Option to pause auto-scroll.

- **Tab 2 — Test Cases**
  - Appears greyed out / disabled while the agent is still running.
  - Summary banner at the top: total count, PR scope.
  - Numbered list of test case strings — one item per string in the array.
  - Each item has a thumbs-up / thumbs-down feedback control (stored client-side for now).
  - No filter bar needed (test cases are plain strings, no type/priority metadata).

### 6.2 UX Details
- Responsive layout (desktop-first, mobile-friendly).
- Loading skeleton on the Thinking Stream tab while the first tokens arrive.
- Graceful error state with a retry button.
- "New Analysis" / "Back" button resets all state.

---

## 7. Non-Functional Requirements

| Concern         | Requirement                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| Streaming       | First token must appear within 3 seconds of submission                      |
| Timeout         | Agent run capped at 5 minutes; stream closed with an `error` event if exceeded |
| Security        | GitHub token and Anthropic key never exposed to the frontend                |
| CORS            | FastAPI configured to only allow the React dev/prod origin                  |
| Rate limiting   | Basic per-IP rate limiting on `/api/analyze` (max 10 req/min)               |
| Error handling  | All agent/tool exceptions caught and forwarded as SSE `error` events        |

---

## 8. Out of Scope (v1)

- User authentication / accounts
- Persisting analysis history to a database
- Automatically writing or committing test code
- Support for non-GitHub repositories (GitLab, Bitbucket)
- Cost tracking / token usage display

---

## 9. Open Questions

1. Do we want to support private GitHub repos from day one, or start with public repos only? (Private repos require the `GITHUB_TOKEN` to be passed to the agent via the prompt, since the built-in `WebFetch` tool uses it as an `Authorization` header.)
2. Should the thumbs-up/down feedback eventually be sent to a backend for fine-tuning or quality tracking?
3. Which Claude model should be the default — Sonnet 4.6 (faster, cheaper) or Opus 4.7 (more capable, requires Agent SDK v0.2.111+)?
4. Should we expose the `session_id` in the UI and offer a "Continue / Ask follow-up" input field, using the SDK's `resume` feature, in v1 or defer to v1.1?

---

*Document version: 0.3 — GitHub integration changed to stub functions via MCP; added custom tools and skills with UI visibility; test cases simplified to list of strings*
*Last updated: 2026-04-26*
