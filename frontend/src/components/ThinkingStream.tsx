import { useEffect, useRef, useState } from "react";
import type { AnalyzeInput, StreamItem as StreamItemType } from "../types";
import { SparkleIcon } from "./icons";
import StreamItem from "./StreamItem";

interface Props {
  items: StreamItemType[];
  isStreaming: boolean;
  input: AnalyzeInput | null;
}

export default function ThinkingStream({ items, isStreaming, input }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const stepCount = items.filter((i) => i.event.type === "tool_use").length;

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  };

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items, autoScroll]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-[18px]"
      >
        {/* Summary card */}
        {input && items.length > 0 && (
          <div
            className="mb-3.5 flex items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13px]"
            style={{ background: "#faf8ff", borderColor: "#ddd2ff" }}
          >
            <SparkleIcon className="shrink-0" size={13} style={{ color: "#6d4ef2" } as React.CSSProperties} />
            <span className="text-[#15151c]">
              Agent ran{" "}
              <strong>{stepCount} step{stepCount !== 1 ? "s" : ""}</strong>{" "}
              to analyze PR <strong>#{input.pullRequestId}</strong>
            </span>
            <span className="ml-auto font-mono text-[12px] text-[#8a8a99]">{input.repoName}</span>
          </div>
        )}

        {/* Empty states */}
        {items.length === 0 && isStreaming && (
          <div className="flex items-center gap-2 py-2 text-[13px] text-[#8a8a99]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-300" />
            Waiting for agent…
          </div>
        )}
        {items.length === 0 && !isStreaming && (
          <p className="py-2 text-[13px] text-[#8a8a99]">
            Run an analysis to see the agent's reasoning here.
          </p>
        )}

        {/* Stream rows */}
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <StreamItem key={item.id} event={item.event} />
          ))}
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      {!autoScroll && isStreaming && (
        <div className="absolute bottom-4 right-5">
          <button
            onClick={() => {
              setAutoScroll(true);
              if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }}
            className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#6d4ef2] shadow ring-1 ring-[#ebebf0] hover:bg-[#f1edff]"
          >
            Resume scroll ↓
          </button>
        </div>
      )}
    </div>
  );
}
