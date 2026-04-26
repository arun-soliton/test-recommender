import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SSEEvent } from "../types";
import { AlertCircleIcon, CheckCircleIcon, ChevronRightIcon, InfoIcon, WrenchIcon } from "./icons";

interface Props {
  event: SSEEvent;
}

interface RowProps {
  kind: "tool" | "reasoning" | "output" | "error";
  icon: React.ReactNode;
  title: React.ReactNode;
  badge?: React.ReactNode;
  summary: React.ReactNode;
  expandedContent?: React.ReactNode;
  noExpand?: boolean;
}

function StreamRow({ kind, icon, title, badge, summary, expandedContent, noExpand }: RowProps) {
  const [open, setOpen] = useState(false);

  const containerStyle: React.CSSProperties =
    kind === "reasoning"
      ? { background: "#faf8ff", borderColor: "#ddd2ff" }
      : kind === "output"
      ? { background: "#e7f7ee", borderColor: "#c8e6d4" }
      : kind === "error"
      ? { background: "#fdecec", borderColor: "#fca5a5" }
      : { background: "#ffffff", borderColor: "#ebebf0" };

  const iconWrapStyle: React.CSSProperties =
    kind === "reasoning"
      ? { background: "#f1edff", color: "#6d4ef2" }
      : kind === "output"
      ? { background: "#d3edde", color: "#16a34a" }
      : kind === "error"
      ? { background: "#fca5a5", color: "#dc2626" }
      : { background: "#f6f6f9", color: "#4a4a58" };

  return (
    <div
      className="rounded-[10px] border transition-colors"
      style={{
        ...containerStyle,
        boxShadow: open ? "0 1px 2px rgba(20,20,35,0.04), 0 1px 3px rgba(20,20,35,0.06)" : undefined,
      }}
    >
      <button
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
        style={{ cursor: noExpand ? "default" : "pointer" }}
        onClick={() => !noExpand && setOpen((v) => !v)}
      >
        {/* icon-wrap */}
        <div
          className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[6px]"
          style={iconWrapStyle}
        >
          {icon}
        </div>

        {/* title */}
        <span className="shrink-0 text-[13px] font-medium text-[#15151c]">{title}</span>

        {/* badge */}
        {badge}

        {/* summary text */}
        <span
          className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11.5px] text-[#8a8a99]"
          style={kind === "reasoning" || kind === "output" ? { fontFamily: "inherit", fontSize: "12.5px" } : {}}
        >
          {summary}
        </span>

        {/* chevron */}
        {!noExpand && (
          <ChevronRightIcon
            className="shrink-0 transition-transform"
            size={13}
            style={{ color: "#b4b4c2", transform: open ? "rotate(90deg)" : undefined } as React.CSSProperties}
          />
        )}
      </button>

      {open && expandedContent && (
        <div className="pb-3 pl-[44px] pr-3 text-[12.5px] leading-[1.55] text-[#4a4a58]">
          {expandedContent}
        </div>
      )}
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant: "builtin" | "custom" | "skill" | "default" }) {
  const style: React.CSSProperties =
    variant === "builtin"
      ? { background: "#f1edff", color: "#6d4ef2" }
      : variant === "custom"
      ? { background: "#fdf3e3", color: "#d97706" }
      : variant === "skill"
      ? { background: "#f1edff", color: "#6d4ef2" }
      : { background: "#f6f6f9", color: "#8a8a99" };

  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium"
      style={style}
    >
      {label}
    </span>
  );
}

export default function StreamItem({ event }: Props) {
  if (event.type === "thinking") {
    return (
      <StreamRow
        kind="reasoning"
        icon={<InfoIcon size={12} />}
        title="Agent reasoning"
        summary={event.data.text.slice(0, 100)}
        expandedContent={
          <div className="prose prose-sm max-w-none text-[12.5px]
            prose-headings:text-[#15151c] prose-strong:text-[#15151c]
            prose-code:text-[#6d4ef2] prose-code:bg-[#f1edff] prose-code:rounded prose-code:px-1
            prose-pre:bg-white/70 prose-pre:text-[#4a4a58]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.data.text}</ReactMarkdown>
          </div>
        }
      />
    );
  }

  if (event.type === "tool_use") {
    const { tool_name, tool_type, input_summary } = event.data;
    const badgeVariant = tool_type === "custom" ? "custom" : tool_type === "skill" ? "skill" : "builtin";
    return (
      <StreamRow
        kind="tool"
        icon={<WrenchIcon size={12} />}
        title={tool_name}
        badge={<Badge label={tool_type} variant={badgeVariant} />}
        summary={input_summary}
        expandedContent={
          <pre className="mt-1 whitespace-pre-wrap break-all rounded-[6px] bg-[#f6f6f9] p-2 font-mono text-[11px] text-[#4a4a58]">
            {input_summary}
          </pre>
        }
      />
    );
  }

  if (event.type === "test_cases") {
    const count = event.data.test_cases.length;
    return (
      <StreamRow
        kind="output"
        icon={<CheckCircleIcon size={12} />}
        title="Test cases generated"
        summary={`${count} test case${count !== 1 ? "s" : ""} produced from PR diff analysis`}
        noExpand
      />
    );
  }

  if (event.type === "error") {
    return (
      <StreamRow
        kind="error"
        icon={<AlertCircleIcon size={12} />}
        title={event.data.message}
        summary=""
        noExpand
      />
    );
  }

  return null;
}
