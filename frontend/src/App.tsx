import { useState } from "react";
import PRInfoPanel from "./components/PRInfoPanel";
import ResultsView from "./components/ResultsView";
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

  const { status, streamItems, testCases, summary, start, reset, setFeedback } =
    useAnalysis();

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!projectName.trim()) e.projectName = "Required";
    if (!repoName.trim()) e.repoName = "Required";
    const n = parseInt(pullRequestId, 10);
    if (!pullRequestId.trim()) e.pullRequestId = "Required";
    else if (isNaN(n) || n <= 0) e.pullRequestId = "Must be a positive number";
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
  };

  const isRunning = status === "streaming";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="flex shrink-0 items-start gap-4 border-b border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 pt-1.5">
          <span className="text-lg">🧪</span>
          <span className="font-semibold text-gray-900">Test Recommender</span>
        </div>

        <div className="flex flex-1 flex-wrap items-start gap-2">
          {/* Project name */}
          <div className="flex flex-col gap-0.5">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Project name"
              disabled={isRunning}
              className={`h-8 rounded-md border px-2.5 text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400 w-40 ${
                errors.projectName ? "border-red-400" : "border-gray-300 focus:border-indigo-400"
              }`}
            />
            {errors.projectName && (
              <span className="text-xs text-red-500">{errors.projectName}</span>
            )}
          </div>

          {/* Repo */}
          <div className="flex flex-col gap-0.5">
            <input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Repo name"
              disabled={isRunning}
              className={`h-8 rounded-md border px-2.5 text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400 w-44 ${
                errors.repoName ? "border-red-400" : "border-gray-300 focus:border-indigo-400"
              }`}
            />
            {errors.repoName && (
              <span className="text-xs text-red-500">{errors.repoName}</span>
            )}
          </div>

          {/* PR ID */}
          <div className="flex flex-col gap-0.5">
            <input
              type="number"
              min="1"
              value={pullRequestId}
              onChange={(e) => setPullRequestId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="PR ID"
              disabled={isRunning}
              className={`h-8 rounded-md border px-2.5 text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400 w-24 ${
                errors.pullRequestId ? "border-red-400" : "border-gray-300 focus:border-indigo-400"
              }`}
            />
            {errors.pullRequestId && (
              <span className="text-xs text-red-500">{errors.pullRequestId}</span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleAnalyze}
              disabled={isRunning}
              className="flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyzing…
                </>
              ) : (
                "Analyze PR"
              )}
            </button>

            {submittedInput && !isRunning && (
              <button
                onClick={handleReset}
                className="h-8 rounded-md border border-gray-300 px-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Body — split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — 35% */}
        <aside className="w-[35%] shrink-0 overflow-hidden border-r border-gray-200 bg-white">
          <PRInfoPanel
            input={submittedInput}
            status={status}
            streamItems={streamItems}
          />
        </aside>

        {/* Right panel — 65% */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <ResultsView
            status={status}
            streamItems={streamItems}
            testCases={testCases}
            summary={summary}
            onFeedback={setFeedback}
          />
        </main>
      </div>
    </div>
  );
}
