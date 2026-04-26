import { useState } from "react";
import type {
  AnalysisStatus,
  AnalysisSummary,
  StreamItem,
  TestCase,
} from "../types";
import TestCasesTab from "./TestCasesTab";
import ThinkingStream from "./ThinkingStream";

interface Props {
  status: AnalysisStatus;
  streamItems: StreamItem[];
  testCases: TestCase[];
  summary: AnalysisSummary | null;
  onFeedback: (id: number, value: "up" | "down" | null) => void;
}

type Tab = "stream" | "tests";

export default function ResultsView({
  status,
  streamItems,
  testCases,
  summary,
  onFeedback,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("stream");
  const testCount = testCases.length;
  const testsReady = status === "complete" && testCount > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-gray-200 bg-white px-4">
        <button
          onClick={() => setActiveTab("stream")}
          className={`-mb-px mr-5 border-b-2 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "stream"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Thinking stream
        </button>
        <button
          onClick={() => testsReady && setActiveTab("tests")}
          aria-disabled={!testsReady}
          className={`-mb-px border-b-2 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "tests"
              ? "border-indigo-600 text-indigo-600"
              : testsReady
              ? "border-transparent text-gray-500 hover:text-gray-700"
              : "border-transparent text-gray-300 cursor-not-allowed"
          }`}
        >
          Test cases
          {testCount > 0 && (
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                activeTab === "tests"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {testCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full ${activeTab === "stream" ? "block" : "hidden"}`}>
          <ThinkingStream items={streamItems} isStreaming={status === "streaming"} />
        </div>
        <div className={`h-full ${activeTab === "tests" ? "block" : "hidden"}`}>
          <TestCasesTab
            status={status}
            testCases={testCases}
            summary={summary}
            onFeedback={onFeedback}
          />
        </div>
      </div>
    </div>
  );
}
