import type { AnalyzeInput, ChatMessage, SSEEvent } from "./types";

const base = () => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function readSSE(
  response: Response,
  onLine: (json: unknown) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const s = line.slice(6).trim();
        if (s) {
          try { onLine(JSON.parse(s)); } catch { /* skip */ }
        }
      }
    }
  }
}

export async function streamAnalysis(
  input: AnalyzeInput,
  onEvent: (event: SSEEvent) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(`${base()}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: input.projectName,
      repo_name: input.repoName,
      pull_request_id: input.pullRequestId,
    }),
    signal,
  });
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try { detail = (await response.json()).detail || detail; } catch { /* ok */ }
    throw new Error(detail);
  }
  await readSSE(response, (e) => onEvent(e as SSEEvent));
}

export async function fetchNotes(
  projectName: string,
  repoName: string,
  prId: number
): Promise<string> {
  try {
    const url =
      `${base()}/api/notes` +
      `?project_name=${encodeURIComponent(projectName)}` +
      `&repo_name=${encodeURIComponent(repoName)}` +
      `&pr_id=${prId}`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    return (data.content as string) ?? "";
  } catch {
    return "";
  }
}

export async function streamChat(
  messages: ChatMessage[],
  context: AnalyzeInput | null,
  onChunk: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(`${base()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      context: context
        ? {
            project_name: context.projectName,
            repo_name: context.repoName,
            pr_id: context.pullRequestId,
          }
        : {},
    }),
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await readSSE(response, (e: unknown) => {
    const ev = e as { type: string; text?: string };
    if (ev.type === "delta" && ev.text) onChunk(ev.text);
  });
}
