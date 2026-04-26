import { useEffect, useRef, useState } from "react";
import type { StreamItem as StreamItemType } from "../types";
import StreamItem from "./StreamItem";

interface Props {
  items: StreamItemType[];
  isStreaming: boolean;
}

export default function ThinkingStream({ items, isStreaming }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(atBottom);
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
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {items.length === 0 && isStreaming && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-300" />
            Waiting for agent…
          </div>
        )}

        {items.length === 0 && !isStreaming && (
          <p className="text-sm text-gray-400">
            Run an analysis to see the agent's reasoning here.
          </p>
        )}

        {items.map((item) => (
          <StreamItem key={item.id} event={item.event} />
        ))}
      </div>

      {!autoScroll && isStreaming && (
        <div className="absolute bottom-3 right-4">
          <button
            onClick={() => {
              setAutoScroll(true);
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-600 shadow-md ring-1 ring-gray-200 hover:bg-indigo-50"
          >
            Resume scroll ↓
          </button>
        </div>
      )}
    </div>
  );
}
