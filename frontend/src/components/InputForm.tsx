import { useState } from "react";
import type { AnalyzeInput } from "../types";

interface Props {
  onSubmit: (input: AnalyzeInput) => void;
  loading: boolean;
}

interface Errors {
  projectName?: string;
  repoName?: string;
  pullRequestId?: string;
}

export default function InputForm({ onSubmit, loading }: Props) {
  const [projectName, setProjectName] = useState("");
  const [repoName, setRepoName] = useState("");
  const [pullRequestId, setPullRequestId] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): Errors => {
    const e: Errors = {};
    if (!projectName.trim()) e.projectName = "Project name is required.";
    if (!repoName.trim()) {
      e.repoName = "Repository name is required.";
    } else if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repoName.trim())) {
      e.repoName = "Must be in owner/repo format (e.g. acme/my-app).";
    }
    const prNum = parseInt(pullRequestId, 10);
    if (!pullRequestId.trim()) {
      e.pullRequestId = "Pull request ID is required.";
    } else if (isNaN(prNum) || prNum <= 0) {
      e.pullRequestId = "Must be a positive integer.";
    }
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      projectName: projectName.trim(),
      repoName: repoName.trim(),
      pullRequestId: parseInt(pullRequestId, 10),
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl shadow-md">
            🧪
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Test Recommender</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze a GitHub PR and get AI-recommended test cases
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          {/* Project name */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Project name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. My Backend Service"
              disabled={loading}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 ${
                errors.projectName
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
              }`}
            />
            {errors.projectName && (
              <p className="mt-1 text-xs text-red-500">{errors.projectName}</p>
            )}
          </div>

          {/* Repo name */}
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Repository
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="owner/repo"
              disabled={loading}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono outline-none transition-colors placeholder:text-gray-400 placeholder:font-sans disabled:bg-gray-50 disabled:text-gray-400 ${
                errors.repoName
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
              }`}
            />
            {errors.repoName && (
              <p className="mt-1 text-xs text-red-500">{errors.repoName}</p>
            )}
          </div>

          {/* PR ID */}
          <div className="mb-7">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Pull request ID
            </label>
            <input
              type="number"
              min="1"
              value={pullRequestId}
              onChange={(e) => setPullRequestId(e.target.value)}
              placeholder="e.g. 42"
              disabled={loading}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 ${
                errors.pullRequestId
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
              }`}
            />
            {errors.pullRequestId && (
              <p className="mt-1 text-xs text-red-500">{errors.pullRequestId}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Analyzing…
              </>
            ) : (
              "Analyze PR"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
