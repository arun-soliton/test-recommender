import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SSEEvent } from "../types";
import { DatabaseIcon, MessageIcon, WrenchIcon } from "./icons";

interface Props {
  event: SSEEvent;
}

export default function StreamItem({ event }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (event.type === "thinking") {
    return (
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-violet-400">
          <MessageIcon />
          Agent reasoning
        </div>
        <div className="prose prose-sm max-w-none text-violet-900
          prose-headings:text-violet-900 prose-headings:font-semibold
          prose-strong:text-violet-900
          prose-code:text-violet-800 prose-code:bg-violet-100 prose-code:rounded prose-code:px-1
          prose-pre:bg-violet-100 prose-pre:text-violet-800
          prose-ul:text-violet-900 prose-ol:text-violet-900
          prose-li:marker:text-violet-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {event.data.text}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  if (event.type === "tool_use") {
    const isCustom = event.data.tool_type === "custom";
    const isSkill = event.data.tool_type === "skill";
    const border = isCustom ? "border-blue-200" : isSkill ? "border-purple-200" : "border-gray-200";
    const bg = isCustom ? "bg-blue-50" : isSkill ? "bg-purple-50" : "bg-gray-50";
    const labelColor = isCustom ? "text-blue-400" : isSkill ? "text-purple-400" : "text-gray-400";
    const nameColor = isCustom ? "text-blue-800" : isSkill ? "text-purple-800" : "text-gray-800";
    const badgeBg = isCustom ? "bg-blue-100 text-blue-600" : isSkill ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500";
    const typeLabel = isCustom ? "custom" : isSkill ? "skill" : "built-in";

    return (
      <div className={`rounded-lg border ${border} ${bg} px-4 py-3`}>
        <div className={`mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${labelColor}`}>
          <WrenchIcon />
          Tool Call
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-semibold ${nameColor}`}>
            {event.data.tool_name}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${badgeBg}`}>
            {typeLabel}
          </span>
        </div>
        {event.data.input_summary && (
          <p className={`mt-1 font-mono text-xs opacity-60 break-all ${nameColor}`}>
            {event.data.input_summary}
          </p>
        )}
      </div>
    );
  }

  if (event.type === "tool_result") {
    return (
      <div className="ml-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-green-500">
            <DatabaseIcon />
            MCP Result
          </div>
          <span className="text-xs text-green-400">{expanded ? "hide ▲" : "show ▼"}</span>
        </button>
        {expanded && (
          <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-green-700">
            {event.data.output_summary}
          </pre>
        )}
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {event.data.message}
        </div>
      </div>
    );
  }

  return null;
}
