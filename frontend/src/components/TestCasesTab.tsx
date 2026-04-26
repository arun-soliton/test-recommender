import { useState } from "react";
import type { AnalysisStatus, AnalysisSummary, TestCase } from "../types";
import { ThumbDownIcon, ThumbUpIcon } from "./icons";

interface Props {
  status: AnalysisStatus;
  testCases: TestCase[];
  summary: AnalysisSummary | null;
  onFeedback: (id: number, value: "up" | "down" | null) => void;
}

function TcRow({ tc, onFeedback }: { tc: TestCase; onFeedback: Props["onFeedback"] }) {
  const [expanded, setExpanded] = useState(false);
  const clean = tc.text.replace(/^["'\-\s]+|["'\s]+$/g, "");

  return (
    <div
      className={`rounded-[10px] border bg-white transition-colors hover:border-[#dcdce4] ${
        expanded
          ? "border-[#dcdce4] shadow-[0_1px_2px_rgba(20,20,35,0.04),0_1px_3px_rgba(20,20,35,0.06)]"
          : "border-[#ebebf0]"
      }`}
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span className="mt-0.5 shrink-0 font-mono text-[11px] font-medium text-[#8a8a99]">
          TC-{String(tc.id + 1).padStart(3, "0")}
        </span>
        <p
          className={`flex-1 text-[13px] font-medium leading-[1.45] text-[#15151c] ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {clean}
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-dashed border-[#ebebf0] px-3.5 py-1.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11.5px] text-[#8a8a99] transition-colors hover:text-[#6d4ef2]"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
        <div className="ml-auto flex items-center gap-0.5">
          <button
            title="Useful"
            onClick={() => onFeedback(tc.id, tc.feedback === "up" ? null : "up")}
            className={`grid h-[26px] w-[26px] place-items-center rounded-[6px] border transition-colors ${
              tc.feedback === "up"
                ? "border-green-200 bg-green-50 text-green-600"
                : "border-transparent text-[#8a8a99] hover:bg-gray-100 hover:text-[#15151c]"
            }`}
          >
            <ThumbUpIcon size={13} />
          </button>
          <button
            title="Not useful"
            onClick={() => onFeedback(tc.id, tc.feedback === "down" ? null : "down")}
            className={`grid h-[26px] w-[26px] place-items-center rounded-[6px] border transition-colors ${
              tc.feedback === "down"
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-transparent text-[#8a8a99] hover:bg-gray-100 hover:text-[#15151c]"
            }`}
          >
            <ThumbDownIcon size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TestCasesTab({ status, testCases, summary, onFeedback }: Props) {
  if (status === "idle") {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-[#8a8a99]">
        Run an analysis to see recommended test cases.
      </div>
    );
  }

  if (status === "streaming" && testCases.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-[#ddd2ff] border-t-[#6d4ef2]" />
          <p className="text-[13px] text-[#8a8a99]">Generating test cases…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-[18px]">
      {summary && (
        <div className="mb-3.5 flex items-center gap-3 rounded-[10px] border border-[#ebebf0] bg-white px-3.5 py-3">
          <div>
            <p className="text-[18px] font-semibold text-[#15151c]">{summary.total_tests}</p>
            <p className="text-[12px] text-[#8a8a99]">
              {summary.total_tests === 1 ? "test case" : "test cases"} recommended
            </p>
          </div>
          {summary.pr_scope && (
            <p className="flex-1 text-[12.5px] text-[#8a8a99]">{summary.pr_scope}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {testCases.map((tc) => (
          <TcRow key={tc.id} tc={tc} onFeedback={onFeedback} />
        ))}
      </div>
    </div>
  );
}
