import type { AnalysisStatus, AnalyzeInput, StreamItem } from "../types";
import StatusBadge from "./StatusBadge";

interface Props {
  input: AnalyzeInput | null;
  status: AnalysisStatus;
  streamItems: StreamItem[];
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800 break-words">{value}</p>
    </div>
  );
}

export default function PRInfoPanel({ input, status, streamItems }: Props) {
  const toolCalls = streamItems
    .filter((i) => i.event.type === "tool_use")
    .map((i) => {
      const e = i.event;
      if (e.type === "tool_use") return { name: e.data.tool_name, type: e.data.tool_type };
      return null;
    })
    .filter(Boolean) as { name: string; type: string }[];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <div>
        <StatusBadge status={status} />
      </div>

      {input ? (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Analysis target
          </h2>
          <div className="space-y-3">
            <Field label="Project" value={input.projectName} />
            <Field label="Repository" value={input.repoName} />
            <Field label="Pull request" value={`#${input.pullRequestId}`} />
          </div>
        </section>
      ) : (
        <p className="text-sm text-gray-400">
          Enter your project details above to start an analysis.
        </p>
      )}

      {toolCalls.length > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Agent activity
            </h2>
            <ul className="space-y-1.5">
              {toolCalls.map((tc, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                  <span className="font-mono text-xs text-gray-600">{tc.name}</span>
                  <span
                    className={`ml-auto rounded px-1.5 py-0.5 text-xs ${
                      tc.type === "custom"
                        ? "bg-blue-50 text-blue-500"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {tc.type}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
