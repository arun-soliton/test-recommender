import { useCallback, useRef, useState } from "react";
import { streamChat } from "../api";
import type { AnalyzeInput, ChatMessage } from "../types";

let counter = 0;
const uid = () => String(counter++);

export function useChat(input: AnalyzeInput | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: ChatMessage = { id: uid(), role: "user", content: text.trim() };
      const assistantId = uid();

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStreaming(true);

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        await streamChat(
          [...messages, userMsg],
          input,
          (chunk) =>
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + chunk } : m
              )
            ),
          ctrl.signal
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, input]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  }, []);

  return { messages, streaming, send, reset };
}
