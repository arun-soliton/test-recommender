import type { AnalysisStatus } from "../types";

interface Props {
  status: AnalysisStatus;
}

export default function StatusBadge({ status }: Props) {
  if (status === "idle") return null;

  const configs = {
    streaming: {
      dot: "bg-yellow-400 animate-pulse",
      text: "text-yellow-800",
      bg: "bg-yellow-50 border-yellow-200",
      label: "Analyzing…",
    },
    complete: {
      dot: "bg-green-400",
      text: "text-green-800",
      bg: "bg-green-50 border-green-200",
      label: "Complete",
    },
    error: {
      dot: "bg-red-400",
      text: "text-red-800",
      bg: "bg-red-50 border-red-200",
      label: "Error",
    },
  } as const;

  const c = configs[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
