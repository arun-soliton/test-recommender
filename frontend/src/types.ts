export type AnalysisStatus = "idle" | "streaming" | "complete" | "error";

export interface AnalyzeInput {
  projectName: string;
  repoName: string;
  pullRequestId: number;
}

export type SSEEvent =
  | { type: "session_start"; data: { session_id: string } }
  | { type: "thinking"; data: { text: string } }
  | {
      type: "tool_use";
      data: {
        tool_name: string;
        tool_type: "custom" | "builtin" | "skill";
        input_summary: string;
      };
    }
  | { type: "tool_result"; data: { output_summary: string } }
  | {
      type: "test_cases";
      data: {
        test_cases: string[];
        summary: { total_tests: number; pr_scope: string };
      };
    }
  | { type: "error"; data: { message: string } }
  | { type: "done"; data: { session_id: string } };

export interface StreamItem {
  id: string;
  event: SSEEvent;
}

export interface TestCase {
  id: number;
  text: string;
  feedback: "up" | "down" | null;
}

export interface AnalysisSummary {
  total_tests: number;
  pr_scope: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
