import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Sparkles, Send, Clock3 } from "lucide-react";

import apiClient from "../api/axios";
import { toast } from "../utils/toast";


const formatTime = (value) => {
  try {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

function safeTrim(value) {
  return (value ?? "").toString().replace(/\u0000/g, "").trim();
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatScrollRef = useRef(null);
  const currentRequestIdRef = useRef(null);



  const suggestions = useMemo(
    () => [
      "Draft a welcome email for new customers",
      "Summarize yesterday’s sales performance",
      "Help me write a product description for Eco Bottle",
      "Create an order follow-up message",
    ],
    []
  );


  useEffect(() => {
    // No timers in the real implementation; keep cleanup minimal.
    return () => {};
  }, []);


  useEffect(() => {
    // Scroll to bottom whenever messages change
    const el = chatScrollRef.current;
    if (!el) return;

    // Defensive: avoid calling scroll if element is detached
    try {
      el.scrollTop = el.scrollHeight;
    } catch {
      // ignore
    }
  }, [messages?.length, loading]);

  const onSubmit = async () => {
    const text = safeTrim(input);
    if (!text) return;
    if (loading) return;

    const userMessage = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    setLoading(true);
    setInput("");

    setMessages((prev) => [...(prev ?? []), userMessage]);

    // Replace mock timeout with real backend call (non-streaming)
    const requestId = uid();
    currentRequestIdRef.current = requestId;

    try {
      const res = await apiClient.post("/ai/chat", { message: text });
      const reply =
        res?.data?.reply && typeof res.data.reply === "string"
          ? res.data.reply
          : "Sorry, I couldn't generate a reply.";

      // Prevent out-of-order updates
      if (currentRequestIdRef.current !== requestId) return;

      const assistantReply = {
        id: uid(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...(prev ?? []), assistantReply]);
    } catch (err) {
      if (currentRequestIdRef.current !== requestId) return;

      toast.error("AI chat failed. Please try again.");

      const assistantReply = {
        id: uid(),
        role: "assistant",
        content:
          "Sorry — something went wrong while contacting the AI service.",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...(prev ?? []), assistantReply]);
    } finally {
      if (currentRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };


  const appendSuggestion = (value) => {
    if (loading) return;
    setInput((prev) => {
      const next = (prev ?? "").toString();
      // Keep it simple: replace if current is empty; otherwise append with newline.
      return safeTrim(next).length === 0 ? value : `${next}\n${value}`;
    });
  };

  const hasMessages = (messages?.length ?? 0) > 0;

  return (
    <div className="w-full min-w-0">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">AI Assistant</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Chat with a mock AI assistant UI. This shell is frontend-only—no backend calls yet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 min-w-0">
        {/* Left sidebar (history placeholder) */}
        <aside className="hidden lg:flex flex-col min-w-0">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-sm p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-indigo-300">
                <Clock3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100">Conversation history</p>
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2"
                >
                  <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
                  <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm min-w-0">
          <div className="flex min-w-0 flex-col h-[70vh] sm:h-[68vh] lg:h-[74vh]">
            {/* Scrollable message area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-5">
              {!hasMessages ? (
                <div className="flex flex-col items-center justify-center text-center h-full">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                    <div className="flex items-center justify-center">
                      <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-indigo-300">
                        <Bot className="h-6 w-6" />
                      </div>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-zinc-100">
                      Ask anything about your business
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-zinc-500">
                      Start with a suggestion below—messages will appear here after you send.
                    </p>
                  </div>

                  <div className="mt-6 w-full max-w-xl">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-3">
                      Suggestions
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => appendSuggestion(s)}
                          disabled={loading}
                          className="text-left rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 hover:bg-zinc-900/50 hover:border-zinc-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-300" />
                            <span className="text-sm font-medium text-zinc-100">Use prompt</span>
                          </div>
                          <div className="mt-2 text-xs text-zinc-400 line-clamp-2">{s}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(messages ?? []).map((m) => {
                    const role = m?.role;
                    const isUser = role === "user";
                    const content = m?.content ?? "";
                    const time = formatTime(m?.createdAt);

                    return (
                      <div
                        key={m?.id ?? uid()}
                        className={
                          isUser
                            ? "flex justify-end"
                            : "flex justify-start"
                        }
                      >
                        <div
                          className={
                            isUser
                              ? "max-w-[85%] sm:max-w-[75%] rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3"
                              : "max-w-[85%] sm:max-w-[75%] rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
                          }
                        >
                          <div className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap break-words">
                            {content}
                          </div>
                          {time ? (
                            <div
                              className={
                                isUser
                                  ? "mt-2 flex items-center justify-end gap-2 text-[11px] text-indigo-200/70"
                                  : "mt-2 flex items-center justify-start gap-2 text-[11px] text-zinc-400"
                              }
                            >
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>{time}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {loading ? (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-emerald-400/10 border border-emerald-400/20 p-1">
                            <Bot className="h-4 w-4 text-emerald-300" />
                          </div>
                          <div className="text-sm text-zinc-200">Thinking…</div>
                        </div>
                        <div className="mt-2 h-2 w-32 animate-pulse rounded bg-zinc-800/80" />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Spacer to prevent input overlap */}
              <div className="h-2" />

              {/* Keep ref on the scroll container */}
              <div ref={chatScrollRef} />
            </div>

            {/* Fixed input at bottom (inside panel) */}
            <div className="border-t border-zinc-800 bg-zinc-950/80 px-3 sm:px-4 py-3">
              <form
                className="flex items-end gap-3 min-w-0"
                onSubmit={(e) => {
                  e.preventDefault();
                  void onSubmit();
                }}
              >
                <div className="flex-1 min-w-0">
                  <label className="sr-only" htmlFor="ai-assistant-input">
                    Message
                  </label>
                  <textarea
                    id="ai-assistant-input"
                    value={input}
                    onChange={(e) => {
                      const next = e?.target?.value ?? "";
                      // Character-safe controlled input
                      const clipped = next.slice(0, 6000);
                      setInput(clipped);
                    }}
                    placeholder="Ask a question…"
                    disabled={loading}
                    rows={1}
                    className="w-full min-w-0 resize-none rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                    onKeyDown={(e) => {
                      // Optional UX: Cmd/Ctrl+Enter to send.
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        void onSubmit();
                      }
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>
                      {safeTrim(input).length > 0 ? `${safeTrim(input).length} chars` : ""}
                    </span>
                    <span className="tabular-nums">
                      Max 6000
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !safeTrim(input)}
                  className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/15 hover:border-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

