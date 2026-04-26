import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchNotes } from "../api";
import type { AnalysisStatus, AnalyzeInput } from "../types";
import StatusBadge from "./StatusBadge";
import { ChevronRightIcon, GitMergeIcon } from "./icons";

interface Props {
  input: AnalyzeInput | null;
  status: AnalysisStatus;
}

function Accordion({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#ebebf0] last:border-b-0">
      <button
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-medium uppercase tracking-[0.04em] text-[#15151c] transition-colors hover:bg-[#f6f6f9]"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex-1">{title}</span>
        <ChevronRightIcon
          size={13}
          className="text-[#8a8a99] transition-transform"
          style={{ transform: open ? "rotate(90deg)" : undefined } as React.CSSProperties}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a8a99]">{label}</span>
      <div className="text-[13px] font-medium text-[#15151c]">{children}</div>
    </div>
  );
}

function NotesSection({ input }: { input: AnalyzeInput | null }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!input) { setContent(""); return; }
    setLoading(true);
    fetchNotes(input.projectName, input.repoName, input.pullRequestId)
      .then(setContent)
      .finally(() => setLoading(false));
  }, [input?.projectName, input?.repoName, input?.pullRequestId]);

  if (loading) {
    return <p className="text-[12px] text-[#8a8a99]">Loading…</p>;
  }

  if (!content) {
    return <p className="text-[12px] text-[#8a8a99]">No notes for this PR.</p>;
  }

  return (
    <div className="prose prose-sm max-w-none text-[12.5px]
      prose-headings:text-[#15151c] prose-headings:font-semibold
      prose-p:text-[#4a4a58] prose-p:leading-relaxed
      prose-strong:text-[#15151c]
      prose-code:text-[#6d4ef2] prose-code:bg-[#f1edff] prose-code:rounded prose-code:px-1
      prose-a:text-[#6d4ef2] prose-a:no-underline hover:prose-a:underline
      prose-ul:text-[#4a4a58] prose-ol:text-[#4a4a58]
      prose-li:marker:text-[#8a8a99]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export default function PRInfoPanel({ input, status }: Props) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Status */}
      <div className="border-b border-[#ebebf0] px-4 py-3.5">
        {status === "idle" ? (
          <p className="text-[12.5px] text-[#8a8a99]">Enter details above to begin.</p>
        ) : (
          <StatusBadge status={status} />
        )}
      </div>

      {/* Analysis target */}
      {input && (
        <Accordion title="Analysis Target">
          <div className="flex flex-col gap-3">
            <MetaRow label="Project">{input.projectName}</MetaRow>
            <MetaRow label="Repository">
              <span className="font-mono text-[12px]">{input.repoName}</span>
            </MetaRow>
            <MetaRow label="Pull Request">
              <span className="flex items-center gap-1.5 text-[#6d4ef2]">
                <GitMergeIcon size={13} className="text-[#6d4ef2]" />
                #{input.pullRequestId}
              </span>
            </MetaRow>
          </div>
        </Accordion>
      )}

      {/* Notes */}
      {input && (
        <Accordion title="Notes" defaultOpen={false}>
          <NotesSection input={input} />
        </Accordion>
      )}

      {!input && (
        <div className="px-4 py-3 text-[12.5px] text-[#8a8a99]">
          Enter your project details above to start an analysis.
        </div>
      )}
    </div>
  );
}
