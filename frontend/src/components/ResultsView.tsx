import { useState } from "react";
import type {
  AnalysisStatus,
  AnalysisSummary,
  AnalyzeInput,
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
  input: AnalyzeInput | null;
  onFeedback: (id: number, value: "up" | "down" | null) => void;
}

type Tab = "stream" | "tests" | "category";

export default function ResultsView({
  status,
  streamItems,
  testCases,
  summary,
  input,
  onFeedback,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("stream");
  const testCount = testCases.length;
  const testsReady = testCount > 0;

  const tab = (id: Tab, label: React.ReactNode, enabled = true) => (
    <button
      onClick={() => enabled && setActiveTab(id)}
      aria-disabled={!enabled}
      className={`relative flex h-11 items-center gap-1.5 px-3.5 text-[13.5px] font-medium transition-colors ${
        activeTab === id
          ? "text-[#15151c]"
          : enabled
          ? "text-[#8a8a99] hover:text-[#4a4a58]"
          : "cursor-not-allowed text-[#b4b4c2]"
      }`}
    >
      {label}
      {activeTab === id && (
        <span className="absolute bottom-[-1px] left-3 right-3 h-0.5 rounded-t-[2px] bg-[#6d4ef2]" />
      )}
    </button>
  );

  return (
    <div className="flex h-full flex-col" style={{ background: "#fafafb" }}>
      {/* Tab bar */}
      <div
        className="flex shrink-0 items-center gap-0.5 border-b border-[#ebebf0] bg-white px-2"
        style={{ height: 44 }}
      >
        {tab("stream", "Thinking stream")}
        {tab(
          "tests",
          <>
            Test cases
            {testCount > 0 && (
              <span
                className={`inline-grid min-w-[18px] place-items-center rounded-full px-1 py-0.5 text-[11px] font-medium ${
                  activeTab === "tests"
                    ? "bg-[#f1edff] text-[#6d4ef2]"
                    : "bg-[#f6f6f9] text-[#8a8a99]"
                }`}
              >
                {testCount}
              </span>
            )}
          </>,
          testsReady
        )}
        {tab("category", "Category", false)}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full ${activeTab === "stream" ? "block" : "hidden"}`}>
          <ThinkingStream
            items={streamItems}
            isStreaming={status === "streaming"}
            input={input}
          />
        </div>
        <div className={`h-full ${activeTab === "tests" ? "block" : "hidden"}`}>
          <TestCasesTab
            status={status}
            testCases={testCases}
            summary={summary}
            onFeedback={onFeedback}
          />
        </div>
        <div className={`h-full ${activeTab === "category" ? "block" : "hidden"}`}>
          <div className="flex h-full items-center justify-center text-[13px] text-[#8a8a99]">
            Category view coming soon.
          </div>
        </div>
      </div>
    </div>
  );
}
