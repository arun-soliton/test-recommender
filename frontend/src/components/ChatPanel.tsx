import { useEffect, useRef, useState } from "react";
import type { AnalyzeInput, ChatMessage } from "../types";
import { useChat } from "../hooks/useChat";
import { SendIcon, XIcon } from "./icons";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

interface Props {
  input: AnalyzeInput | null;
  onClose: () => void;
}

const SUGGESTIONS = [
  "Summarise the recommended test cases",
  "Which tests cover edge cases?",
  "What are the riskiest areas in this PR?",
  "How should I prioritise these tests?",
];

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
        role === "assistant"
          ? "bg-[#f1edff] text-[#6d4ef2]"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {role === "assistant" ? "AI" : "U"}
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-2 text-[13px] leading-relaxed">
      <Avatar role={msg.role} />
      <div
        className={`rounded-[10px] px-3 py-2 text-[13px] leading-[1.55] ${
          msg.role === "assistant"
            ? "bg-[#faf8ff] text-[#15151c]"
            : "bg-gray-100 text-[#15151c]"
        }`}
      >
        {msg.content || <span className="text-gray-400">…</span>}
      </div>
    </div>
  );
}

export default function ChatPanel({ input, onClose }: Props) {
  const { messages, streaming, send, reset } = useChat(input);
  const [draft, setDraft] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim() || streaming) return;
    send(draft.trim());
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="chat-panel-enter absolute right-3 top-[68px] z-50 flex w-[380px] flex-col overflow-hidden rounded-[14px] border border-[#ebebf0] bg-white"
      style={{
        maxHeight: "calc(100vh - 84px)",
        boxShadow: "0 10px 30px rgba(20,20,35,0.10), 0 20px 60px rgba(20,20,35,0.10)",
      }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#ebebf0] px-3.5 py-3">
        <div
          className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] text-white"
          style={{ background: "linear-gradient(135deg, #6d4ef2 0%, #4a2fd6 100%)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z" />
          </svg>
        </div>
        <span className="text-[14px] font-semibold text-[#15151c]">AI Assistant</span>
        {input && (
          <span className="ml-1 text-[12px] text-[#8a8a99]">
            PR #{input.pullRequestId}
          </span>
        )}
        {messages.length > 0 && (
          <button
            title="Clear conversation"
            className="ml-auto rounded-[6px] p-1.5 text-[#8a8a99] transition-colors hover:bg-red-50 hover:text-red-500"
            onClick={reset}
          >
            <TrashIcon />
          </button>
        )}
        <button
          className={`${messages.length > 0 ? "" : "ml-auto"} rounded-[6px] p-1 text-[#8a8a99] transition-colors hover:bg-gray-100 hover:text-[#15151c]`}
          onClick={onClose}
        >
          <XIcon size={15} />
        </button>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 py-4">
        {messages.length === 0 ? (
          <div className="py-6 text-center">
            <div
              className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-[14px] text-white"
              style={{
                background: "linear-gradient(135deg, #6d4ef2 0%, #4a2fd6 100%)",
                boxShadow: "0 4px 12px rgba(109,78,242,0.3)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z" />
              </svg>
            </div>
            <h4 className="mb-1 text-[14px] font-semibold text-[#15151c]">Ask about this PR</h4>
            <p className="mb-4 text-[12.5px] leading-relaxed text-[#8a8a99]">
              Ask questions about the test recommendations, PR changes, or testing strategy.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-[6px] border border-[#ebebf0] bg-[#f6f6f9] px-2.5 py-2 text-left text-[12.5px] text-[#4a4a58] transition-colors hover:border-[#ddd2ff] hover:bg-[#faf8ff] hover:text-[#15151c]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} />)
        )}
      </div>

      {/* Input */}
      <div className="flex shrink-0 items-end gap-2 border-t border-[#ebebf0] px-3 py-2.5">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          rows={1}
          className="flex-1 resize-none rounded-[6px] border border-[#dcdce4] bg-white px-2.5 py-2 text-[13px] text-[#15151c] outline-none transition-shadow placeholder:text-[#b4b4c2] focus:border-[#6d4ef2] focus:shadow-[0_0_0_3px_rgba(109,78,242,0.12)]"
          style={{ minHeight: 36, maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || streaming}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "#6d4ef2" }}
          onMouseEnter={(e) => { if (!streaming && draft.trim()) (e.currentTarget as HTMLElement).style.background = "#5d3ee8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#6d4ef2"; }}
        >
          <SendIcon size={14} />
        </button>
      </div>
    </div>
  );
}
