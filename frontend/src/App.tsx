import { useRef, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import PRInfoPanel from "./components/PRInfoPanel";
import ResultsView from "./components/ResultsView";
import StatusBadge from "./components/StatusBadge";
import { ChatIcon, FlaskIcon, SparkleIcon } from "./components/icons";
import { useAnalysis } from "./hooks/useAnalysis";
import type { AnalyzeInput } from "./types";

interface FormErrors {
  projectName?: string;
  repoName?: string;
  pullRequestId?: string;
}

export default function App() {
  const [projectName, setProjectName] = useState("");
  const [repoName, setRepoName] = useState("");
  const [pullRequestId, setPullRequestId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedInput, setSubmittedInput] = useState<AnalyzeInput | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const { status, streamItems, testCases, summary, start, reset, setFeedback } = useAnalysis();

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!projectName.trim()) e.projectName = "Required";
    if (!repoName.trim()) e.repoName = "Required";
    if (!pullRequestId.trim()) e.pullRequestId = "Required";
    else if (isNaN(parseInt(pullRequestId, 10)) || parseInt(pullRequestId, 10) <= 0)
      e.pullRequestId = "Positive number";
    return e;
  };

  const handleAnalyze = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const input: AnalyzeInput = {
      projectName: projectName.trim(),
      repoName: repoName.trim(),
      pullRequestId: parseInt(pullRequestId, 10),
    };
    setSubmittedInput(input);
    start(input);
  };

  const handleReset = () => {
    reset();
    setSubmittedInput(null);
    setErrors({});
    setChatOpen(false);
  };

  const isRunning = status === "streaming";

  const inputCls = (err?: string) =>
    `h-8 rounded-[6px] border px-2.5 text-[13px] text-[#15151c] outline-none transition-shadow placeholder:text-[#b4b4c2] disabled:bg-[#f6f6f9] disabled:text-[#8a8a99] ${
      err
        ? "border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]"
        : "border-[#dcdce4] focus:border-[#6d4ef2] focus:shadow-[0_0_0_3px_rgba(109,78,242,0.12)]"
    }`;

  return (
    <div className="grid h-screen overflow-hidden" style={{ gridTemplateRows: "auto 1fr" }}>

      {/* ── Topbar ───────────────────────────────────────────────────── */}
      <header
        className="relative flex items-end gap-3 border-b border-[#ebebf0] bg-white px-[18px] pb-2.5 pt-3"
        style={{ minHeight: 68, zIndex: 30 }}
      >
        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2 self-center pr-3 mr-1 border-r border-[#ebebf0]">
          <div
            className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] text-white"
            style={{ background: "linear-gradient(135deg, #6d4ef2 0%, #4a2fd6 100%)", boxShadow: "0 2px 6px rgba(109,78,242,0.3)" }}
          >
            <FlaskIcon size={13} />
          </div>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-[#15151c]">
            Test Recommender
          </span>
        </div>

        {/* Form fields */}
        <div className="flex flex-1 items-end gap-3">
          {/* Project */}
          <div className="flex flex-col gap-[2px]">
            <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a8a99]">Project</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="payments"
              disabled={isRunning}
              className={`${inputCls(errors.projectName)} w-36`}
            />
            {errors.projectName && <span className="text-[10.5px] text-red-500">{errors.projectName}</span>}
          </div>

          {/* Repo */}
          <div className="flex flex-col gap-[2px]">
            <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a8a99]">Repo</label>
            <input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="payments-api"
              disabled={isRunning}
              className={`${inputCls(errors.repoName)} w-44`}
            />
            {errors.repoName && <span className="text-[10.5px] text-red-500">{errors.repoName}</span>}
          </div>

          {/* PR */}
          <div className="flex flex-col gap-[2px]">
            <label className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a8a99]">PR Number</label>
            <input
              type="number"
              min="1"
              value={pullRequestId}
              onChange={(e) => setPullRequestId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="1284"
              disabled={isRunning}
              className={`${inputCls(errors.pullRequestId)} w-24`}
            />
            {errors.pullRequestId && <span className="text-[10.5px] text-red-500">{errors.pullRequestId}</span>}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isRunning}
              className="flex h-8 items-center gap-1.5 rounded-[6px] px-3.5 text-[13px] font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "#6d4ef2" }}
              onMouseEnter={(e) => { if (!isRunning) (e.currentTarget as HTMLElement).style.background = "#5d3ee8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#6d4ef2"; }}
            >
              {isRunning ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyzing…
                </>
              ) : (
                <>
                  <SparkleIcon size={11} />
                  Analyze PR
                </>
              )}
            </button>

            {status !== "idle" && !isRunning && (
              <button
                onClick={handleReset}
                className="h-8 rounded-[6px] border border-[#dcdce4] px-3 text-[13px] text-[#4a4a58] transition-colors hover:bg-[#f6f6f9]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: status + chat */}
        <div className="flex shrink-0 items-center gap-3 self-center">
          <StatusBadge status={status} />
          <button
            onClick={() => setChatOpen((v) => !v)}
            className={`grid h-8 w-8 place-items-center rounded-[6px] border transition-colors ${
              chatOpen
                ? "border-[#ddd2ff] bg-[#f1edff] text-[#6d4ef2]"
                : "border-[#ebebf0] text-[#8a8a99] hover:bg-[#f6f6f9] hover:text-[#15151c]"
            }`}
          >
            <ChatIcon size={16} />
          </button>
        </div>

        {/* Chat panel (absolute, anchored to topbar) */}
        {chatOpen && (
          <div ref={chatRef} className="absolute right-0 top-0 w-0">
            <ChatPanel input={submittedInput} onClose={() => setChatOpen(false)} />
          </div>
        )}
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="grid overflow-hidden" style={{ gridTemplateColumns: "320px 1fr" }}>
        {/* Left rail */}
        <aside className="flex flex-col overflow-hidden border-r border-[#ebebf0] bg-white">
          <PRInfoPanel input={submittedInput} status={status} />
        </aside>

        {/* Right pane */}
        <main className="flex flex-col overflow-hidden">
          <ResultsView
            status={status}
            streamItems={streamItems}
            testCases={testCases}
            summary={summary}
            input={submittedInput}
            onFeedback={setFeedback}
          />
        </main>
      </div>
    </div>
  );
}
