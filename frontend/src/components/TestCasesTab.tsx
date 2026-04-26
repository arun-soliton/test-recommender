import type { AnalysisStatus, AnalysisSummary, TestCase } from "../types";
import { ThumbDownIcon, ThumbUpIcon } from "./icons";

interface Props {
  status: AnalysisStatus;
  testCases: TestCase[];
  summary: AnalysisSummary | null;
  onFeedback: (id: number, value: "up" | "down" | null) => void;
}

export default function TestCasesTab({ status, testCases, summary, onFeedback }: Props) {
  if (status === "idle") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Run an analysis to see recommended test cases.
      </div>
    );
  }

  if (status === "streaming" && testCases.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-gray-400">Generating test cases…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {summary && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
          <p className="text-sm font-semibold text-indigo-800">
            {summary.total_tests} test case{summary.total_tests !== 1 ? "s" : ""} recommended
          </p>
          <p className="mt-0.5 text-xs text-indigo-500">{summary.pr_scope}</p>
        </div>
      )}

      <ol className="space-y-2">
        {testCases.map((tc) => (
          <li
            key={tc.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {tc.id + 1}
            </span>
            <p className="flex-1 text-sm text-gray-700">
              {tc.text.replace(/^["'\-\s]+|["'\s]+$/g, "")}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button
                title="Useful"
                onClick={() => onFeedback(tc.id, tc.feedback === "up" ? null : "up")}
                className={`rounded p-1 transition-colors ${
                  tc.feedback === "up"
                    ? "text-green-600 bg-green-50"
                    : "text-gray-300 hover:text-green-500"
                }`}
              >
                <ThumbUpIcon />
              </button>
              <button
                title="Not useful"
                onClick={() => onFeedback(tc.id, tc.feedback === "down" ? null : "down")}
                className={`rounded p-1 transition-colors ${
                  tc.feedback === "down"
                    ? "text-red-500 bg-red-50"
                    : "text-gray-300 hover:text-red-400"
                }`}
              >
                <ThumbDownIcon />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
