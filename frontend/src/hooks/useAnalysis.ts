import { useCallback, useRef, useState } from "react";
import { streamAnalysis } from "../api";
import type {
  AnalysisStatus,
  AnalysisSummary,
  AnalyzeInput,
  SSEEvent,
  StreamItem,
  TestCase,
} from "../types";

let itemCounter = 0;

const STREAM_VISIBLE: SSEEvent["type"][] = [
  "thinking",
  "tool_use",
  "tool_result",
  "error",
];

export function useAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (input: AnalyzeInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("streaming");
    setStreamItems([]);
    setTestCases([]);
    setSummary(null);

    const handleEvent = (event: SSEEvent) => {
      if (STREAM_VISIBLE.includes(event.type as SSEEvent["type"])) {
        setStreamItems((prev) => [
          ...prev,
          { id: String(itemCounter++), event },
        ]);
      }

      if (event.type === "test_cases") {
        setTestCases(
          event.data.test_cases.map((text, i) => ({ id: i, text, feedback: null }))
        );
        setSummary(event.data.summary);
      }

      if (event.type === "done") setStatus("complete");
      if (event.type === "error") setStatus("error");
    };

    try {
      await streamAnalysis(input, handleEvent, controller.signal);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setStreamItems((prev) => [
        ...prev,
        {
          id: String(itemCounter++),
          event: {
            type: "error",
            data: { message: err instanceof Error ? err.message : "Unknown error" },
          },
        },
      ]);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setStreamItems([]);
    setTestCases([]);
    setSummary(null);
  }, []);

  const setFeedback = useCallback((id: number, feedback: "up" | "down" | null) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, feedback } : tc))
    );
  }, []);

  return { status, streamItems, testCases, summary, start, reset, setFeedback };
}
