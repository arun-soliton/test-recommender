import type { AnalysisStatus } from "../types";

interface Props {
  status: AnalysisStatus;
}

export default function StatusBadge({ status }: Props) {
  if (status === "idle") return null;

  const cfg = {
    streaming: { dot: "bg-amber-400 animate-pulse", text: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Analyzing…" },
    complete:  { dot: "bg-green-500",               text: "text-green-700",  bg: "bg-green-50  border-green-200",  label: "Complete"   },
    error:     { dot: "bg-red-500",                  text: "text-red-700",   bg: "bg-red-50    border-red-200",    label: "Error"      },
  } as const;

  const c = cfg[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
