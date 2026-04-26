import type { AnalyzeInput, SSEEvent } from "./types";

export async function streamAnalysis(
  input: AnalyzeInput,
  onEvent: (event: SSEEvent) => void,
  signal: AbortSignal
): Promise<void> {
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  const response = await fetch(`${base}/api/analyze`, {
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
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore parse error
    }
    throw new Error(detail);
  }

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
        const jsonStr = line.slice(6).trim();
        if (jsonStr) {
          try {
            const event = JSON.parse(jsonStr) as SSEEvent;
            onEvent(event);
          } catch {
            // skip malformed line
          }
        }
      }
    }
  }
}
