import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Sparkles, Send, Clock3, History, X, PencilLine, Trash2 } from "lucide-react";


import apiClient from "../api/axios";
import { toast } from "../utils/toast";
import AiMarkdownMessage from "../components/ai/AiMarkdownMessage";
import { aiPromptTemplates } from "../constants/aiPromptTemplates";

const formatTime = (value) => {
  try {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatRelativeTime = (value) => {
  try {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const sec = Math.max(0, diffSec);

    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (sec < minute) return `${sec}s ago`;
    if (sec < hour) return `${Math.floor(sec / minute)}m ago`;
    if (sec < day) return `${Math.floor(sec / hour)}h ago`;

    // Yesterday/Today
    const d0 = new Date(now);
    d0.setHours(0, 0, 0, 0);
    const d1 = new Date(d);
    d1.setHours(0, 0, 0, 0);

    const days = Math.floor((d0.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";

    return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });

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
  const [streaming, setStreaming] = useState(false);

  // Conversation management UI state (tightly scoped)
  const [activeRenameId, setActiveRenameId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);


  const [conversationId, setConversationId] = useState(() => {
    try {
      return localStorage.getItem("conversationId") || null;
    } catch {
      return null;
    }
  });

  const [conversationList, setConversationList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);

  const chatScrollRef = useRef(null);
  const currentRequestIdRef = useRef(null);
  const creatingNewConversationRef = useRef(false);

  const abortStreamControllerRef = useRef(null);
  const streamingAssistantIdRef = useRef(null);

  const scrollRafRef = useRef(null);
  const pendingScrollRef = useRef(false);

  const requestIdForStreamingRef = useRef(null);

  const templateInsertLockRef = useRef(false);

  const suggestions = useMemo(
    () => [
      "Draft a welcome email for new customers",
      "Summarize yesterday’s sales performance",
      "Help me write a product description for Eco Bottle",
      "Create an order follow-up message",
    ],
    []
  );

  const insertPromptTemplate = (promptText) => {
    if (!promptText) return;
    if (loading || streaming) return;
    if (templateInsertLockRef.current) return;

    templateInsertLockRef.current = true;
    Promise.resolve().finally(() => {
      templateInsertLockRef.current = false;
    });

    setInput((prev) => {
      const current = (prev ?? "").toString();
      const trimmed = current.replace(/\u0000/g, "");

      if (!safeTrim(trimmed)) return promptText;
      return `${trimmed}\n${promptText}`;
    });
  };

  const appendSuggestion = (value) => {
    if (loading) return;
    setInput((prev) => {
      const next = (prev ?? "").toString();
      return safeTrim(next).length === 0 ? value : `${next}\n${value}`;
    });
  };

  const refreshConversationList = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await apiClient.get("/ai/conversations");
      const list = res?.data?.conversations;
      setConversationList(Array.isArray(list) ? list : []);
    } catch {
      setConversationList([]);
      setHistoryError("Failed to load conversation history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void refreshConversationList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    const el = chatScrollRef.current;

    if (!el) return;

    try {
      el.scrollTop = el.scrollHeight;
    } catch {
      // ignore
    }
  }, [messages?.length, loading, streaming]);

  useEffect(() => {
    // Close drawer on Escape (mobile/tablet only)
    const onKeyDown = (e) => {
      if (e?.key === "Escape") setHistoryOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    // No timers in the real implementation; keep cleanup minimal.
    return () => {};
  }, []);

  const quickActionCategories = useMemo(() => {
    const suggestionsByCategory = {
      Inventory: [],
      Analytics: [],
      Customers: [],
      Marketing: [],
      Orders: [],
    };

    if (suggestions?.[0]) suggestionsByCategory.Customers.push(suggestions[0]);
    if (suggestions?.[1]) suggestionsByCategory.Analytics.push(suggestions[1]);
    if (suggestions?.[2]) suggestionsByCategory.Marketing.push(suggestions[2]);
    if (suggestions?.[3]) suggestionsByCategory.Orders.push(suggestions[3]);

    const templatesByCategory =
      aiPromptTemplates?.reduce((acc, cat) => {
        const key = cat?.category;
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(...(cat?.templates ?? []));
        return acc;
      }, {}) ?? {};

    const order = ["Inventory", "Analytics", "Customers", "Marketing", "Orders"];

    return order
      .map((cat) => {
        const templates = templatesByCategory?.[cat] ?? [];
        const suggestionTexts = suggestionsByCategory?.[cat] ?? [];
        return {
          category: cat,
          templates,
          suggestions: suggestionTexts,
        };
      })
      .filter(
        (x) => (x.templates?.length ?? 0) + (x.suggestions?.length ?? 0) > 0
      );
  }, [suggestions]);

  const hasMessages = (messages?.length ?? 0) > 0;

  // Mobile-only collapsing for Quick Actions (lg and up remain unchanged)
  const [actionsCollapsed, setActionsCollapsed] = useState(false);
  const [isMobileActionsMode, setIsMobileActionsMode] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const update = () => setIsMobileActionsMode(!!mq.matches);
    update();
    // Safari compatibility: addListener/removeListener fallback
    if (mq.addEventListener) mq.addEventListener("change", update);
    else if (mq.addListener) mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else if (mq.removeListener) mq.removeListener(update);
    };
  }, []);

  const onSubmit = async () => {
    const text = safeTrim(input);
    if (!text) return;
    if (loading || streaming) return;

    // Auto-collapse after the first user message is sent (mobile only)
    // This runs before we push the user message into state.
    if (isMobileActionsMode && !hasMessages) {
      setActionsCollapsed(true);
    }


    if (!conversationId && creatingNewConversationRef.current) return;

    const userMessage = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    if (!conversationId) creatingNewConversationRef.current = true;

    setLoading(true);
    setInput("");

    setMessages((prev) => [...(prev ?? []), userMessage]);

    const requestId = uid();
    currentRequestIdRef.current = requestId;

    try {
      const res = await apiClient.post("/ai/chat", {
        message: text,
        conversationId: conversationId || undefined,
      });

      const reply =
        res?.data?.reply && typeof res.data.reply === "string"
          ? res.data.reply
          : "Sorry, I couldn't generate a reply.";

      const returnedConversationId =
        res?.data?.conversationId &&
        typeof res.data.conversationId === "string"
          ? res.data.conversationId
          : null;

      if (returnedConversationId) {
        setConversationId(returnedConversationId);
        try {
          localStorage.setItem("conversationId", returnedConversationId);
        } catch {
          // ignore
        }

        void refreshConversationList();
      }

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

  const sidebarContent = (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-sm p-4">
      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-indigo-300">
          <Clock3 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">Conversation history</p>
          <p className="text-xs text-zinc-500">
            {historyLoading
              ? "Loading…"
              : conversationList?.length
                ? ""
                : "No conversations yet"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (loading) return;
            creatingNewConversationRef.current = false;
            setConversationId(null);
            try {
              localStorage.removeItem("conversationId");
            } catch {
              // ignore
            }
            setMessages([]);
            setInput("");
          }}
          className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-900/55 hover:border-zinc-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          New Chat
        </button>
      </div>

      {historyError ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-200">
          {historyError}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {historyLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2"
            >
              <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-zinc-800" />
            </div>
          ))
        ) : (conversationList ?? []).length ? (
          <div className="space-y-2">
            {(conversationList ?? []).map((c) => {
              const isActive = c?.id && c.id === conversationId;
              const title = c?.title || "Untitled";
              const preview = c?.latestMessagePreview || "";
              const isRenaming = activeRenameId && c?.id === activeRenameId;
              const isDeleting = pendingDeleteId && c?.id === pendingDeleteId;

              return (
                <div
                  key={c?.id}
                  className={
                    "w-full rounded-xl border transition overflow-hidden " +
                    (isActive
                      ? "border-indigo-500/30 bg-indigo-500/10"
                      : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/55 hover:border-zinc-700")
                  }
                >
                  <button
                    type="button"
                    onClick={async () => {
                      const nextId = c?.id;
                      if (!nextId) return;
                      if (nextId === conversationId) return;

                      setConversationId(nextId);
                      try {
                        localStorage.setItem("conversationId", nextId);
                      } catch {
                        // ignore
                      }

                      const reqId = uid();
                      currentRequestIdRef.current = reqId;
                      setLoading(true);
                      try {
                        const res = await apiClient.get(`/ai/conversations/${nextId}`);
                        if (currentRequestIdRef.current !== reqId) return;

                        const msgs = res?.data?.messages;
                        setMessages(Array.isArray(msgs) ? msgs : []);
                      } catch {
                        if (currentRequestIdRef.current !== reqId) return;
                        toast.error("Failed to load conversation");
                        setMessages([]);
                      } finally {
                        if (currentRequestIdRef.current === reqId) {
                          setLoading(false);
                        }
                      }

                      // Close drawer after selection on mobile/tablet
                      setHistoryOpen(false);
                    }}
                    className="group w-full px-3 py-2 text-left"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isRenaming ? (
                          <div className="flex-1 min-w-0">
                            <input
                              value={renameDraft}
                              autoFocus
                              onChange={(e) => setRenameDraft(e?.target?.value ?? "")}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  e.stopPropagation();
                                  setActiveRenameId(null);
                                  setRenameDraft("");
                                  return;
                                }
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  (async () => {
                                    if (renameSaving) return;
                                    setRenameSaving(true);
                                    try {
                                      const nextTitle = safeTrim(renameDraft);
                                      if (!nextTitle) {
                                        toast.error("Title cannot be empty");
                                        return;
                                      }

                                      const id = activeRenameId;
                                      setConversationList((prev) =>
                                        (prev ?? []).map((x) =>
                                          x?.id === id ? { ...x, title: nextTitle } : x
                                        )
                                      );
                                    } finally {
                                      setRenameSaving(false);
                                      setActiveRenameId(null);
                                      setRenameDraft("");
                                    }
                                  })();
                                }
                              }}
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                          </div>
                        ) : (
                          <p className="truncate text-sm font-semibold text-zinc-100">
                            {title}
                          </p>
                        )}

                        <span className="shrink-0 text-[11px] text-zinc-400">
                          {formatRelativeTime(c?.updatedAt)}
                        </span>

                        <div
                          className={
                            "ml-auto flex items-center gap-1 " +
                            (isActive || isRenaming || isDeleting
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100") +
                            " transition-opacity"
                          }
                        >
                          {isRenaming ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (renameSaving) return;
                                  (async () => {
                                    setRenameSaving(true);
                                    try {
                                      const nextTitle = safeTrim(renameDraft);
                                      if (!nextTitle) {
                                        toast.error("Title cannot be empty");
                                        return;
                                      }
                                      const id = activeRenameId;
                                      setConversationList((prev) =>
                                        (prev ?? []).map((x) =>
                                          x?.id === id ? { ...x, title: nextTitle } : x
                                        )
                                      );
                                    } finally {
                                      setRenameSaving(false);
                                      setActiveRenameId(null);
                                      setRenameDraft("");
                                    }
                                  })();
                                }}
                                aria-label="Save rename"
                                className="rounded-lg border border-indigo-500/25 bg-indigo-500/10 p-1 text-indigo-200 hover:bg-indigo-500/15 hover:border-indigo-500/35 transition disabled:opacity-60"
                                disabled={renameSaving || loading}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRenameId(null);
                                  setRenameDraft("");
                                }}
                                aria-label="Cancel rename"
                                className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-1 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 transition"
                                disabled={renameSaving}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRenameId(c?.id);
                                  setRenameDraft(title);
                                }}
                                aria-label="Rename conversation"
                                className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-1 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 transition disabled:opacity-60"
                                disabled={loading}
                              >
                                <PencilLine size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingDeleteId(c?.id);
                                }}
                                aria-label="Delete conversation"
                                className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-1 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 transition disabled:opacity-60"
                                disabled={loading}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isDeleting ? (
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-[12px] text-rose-200">
                            Delete this conversation?
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deleteSaving) return;
                                (async () => {
                                  setDeleteSaving(true);
                                  try {
                                    const id = pendingDeleteId;
                                    setConversationList((prev) =>
                                      (prev ?? []).filter((x) => x?.id !== id)
                                    );
                                    if (conversationId === pendingDeleteId) {
                                      setConversationId(null);
                                      setMessages([]);
                                      try {
                                        localStorage.removeItem("conversationId");
                                      } catch {
                                        // ignore
                                      }
                                    }
                                  } finally {
                                    setDeleteSaving(false);
                                    setPendingDeleteId(null);
                                  }
                                })();
                              }}
                              className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-[12px] font-semibold text-rose-200 hover:bg-rose-500/20 transition disabled:opacity-60"
                              disabled={deleteSaving || loading}
                            >
                              {deleteSaving ? "Deleting…" : "Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDeleteId(null);
                              }}
                              className="rounded-lg border border-zinc-800 bg-zinc-950/30 px-3 py-1 text-[12px] font-semibold text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 transition"
                              disabled={deleteSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : preview ? (
                        <p className="mt-1 truncate text-xs text-zinc-400">
                          {preview}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-zinc-500">No messages</p>
                      )}
                    </div>
                  </button>
                </div>
              );

            })}

          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-4 text-sm text-zinc-400">
            Start a conversation to see it appear here.
          </div>
        )}
      </div>
    </div>
  );

  const QuickActionsPanel = (
    <div className="mt-4 w-full max-w-xl">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Quick Actions
        </div>

        {/* Mobile-only compact toggle */}
        <button
          type="button"
          onClick={() => setActionsCollapsed((v) => !v)}
          className={
            "lg:hidden shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-900/60 hover:border-zinc-700 transition disabled:opacity-60"
          }
          disabled={loading || streaming}
          aria-expanded={!actionsCollapsed}
        >
          {actionsCollapsed ? "Show Actions" : "Hide Actions"}
        </button>
      </div>

      {/* Mobile-only collapse wrapper; desktop stays unchanged */}
      <div
        className={
          "lg:block " +
          "transition-[max-height,opacity,transform] duration-300 ease-out will-change-transform"
        }
        style={{
          maxHeight: actionsCollapsed ? 0 : 1000,
          opacity: actionsCollapsed ? 0 : 1,
          transform: actionsCollapsed ? "translateY(-6px)" : "translateY(0)",
          overflow: actionsCollapsed ? "hidden" : "visible",
        }}
      >
        <div className="space-y-3">
          {quickActionCategories.map((cat) => (
            <div key={cat.category}>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-100">{cat.category}</div>
                <div className="text-[11px] text-zinc-500">
                  {(cat.templates?.length ?? 0) + (cat.suggestions?.length ?? 0)} actions
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(cat.templates ?? []).map((t) => (
                  <button
                    key={t?.id || t?.title}
                    type="button"
                    onClick={() => insertPromptTemplate(t?.prompt)}
                    disabled={loading || streaming}
                    className="min-w-0 text-left rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 hover:bg-zinc-900/50 hover:border-zinc-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start gap-2">
                      <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-1 shrink-0">
                        <Sparkles className="h-4 w-4 text-indigo-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-100 truncate">
                          {t?.title}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-400 line-clamp-3 break-words">
                          {t?.prompt}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {(cat.suggestions ?? []).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => appendSuggestion(s)}
                    disabled={loading || streaming}
                    className="text-left rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 hover:bg-zinc-900/50 hover:border-zinc-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                      <span className="text-sm font-medium text-zinc-100">Use prompt</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-400 line-clamp-2 break-words">
                      {s}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6.5rem)] lg:h-[calc(100dvh-6rem)] w-full min-w-0 overflow-hidden">
      <div className="hidden sm:block mb-3 sm:mb-5 shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
          AI Assistant
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Chat with a mock AI assistant UI. This shell is frontend-only—no backend calls yet.
        </p>
      </div>


      {/* Mobile/tablet history drawer + desktop fixed sidebar */}
      <div className="relative flex-1 min-h-0">
        {/* Backdrop */}
        {historyOpen ? (
          <div
            className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <div className="h-full grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3 sm:gap-4 lg:gap-6 min-w-0 overflow-hidden">
          {/* Desktop sidebar */}
          <aside className="hidden lg:flex flex-col min-w-0 h-full overflow-y-auto">
            {sidebarContent}
          </aside>

          {/* Drawer sidebar (mobile/tablet only) */}
          <aside
            className={
              "fixed inset-y-0 left-0 z-50 w-[92vw] sm:w-[360px] max-w-[420px] transform transition-transform duration-200 ease-out " +
              (historyOpen ? "translate-x-0" : "-translate-x-full")
            }
            style={{
              // keep drawer above layout; safe for overflow
              maxHeight: "100vh",
            }}
          >
            <div className="h-full flex flex-col min-w-0">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-indigo-300">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">History</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-700 transition"
                  aria-label="Close history"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-4 pb-4 flex-1 overflow-y-auto min-w-0">
                {sidebarContent}
              </div>
            </div>
          </aside>

          {/* Chat panel */}
          <section className="flex flex-col h-full rounded-2xl border border-zinc-800/60 bg-zinc-950 shadow-sm min-w-0 overflow-hidden">
            {/* Top bar with mobile history button */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-3 py-2 sm:py-3 border-b border-zinc-800/70 z-10 bg-zinc-950/90 backdrop-blur">
              <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-[13px] font-semibold text-zinc-100 truncate">AI Assistant</div>
              </div>


              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/15 hover:border-indigo-500/30 transition disabled:opacity-60"
                disabled={loading}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* Scrollable message area (single overflow-y container) */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:px-5 overflow-x-hidden overscroll-contain">
                {!hasMessages ? (


                  <div className="flex flex-col items-center justify-center text-center h-full px-2">
                    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-4">
                      <div className="flex items-center justify-center">
                        <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-2.5 text-indigo-300">
                          <Bot className="h-5 w-5" />
                        </div>
                      </div>
                      <h2 className="mt-3 text-base font-semibold text-zinc-100">
                        Ask anything about your business
                      </h2>
                      <p className="mt-1.5 max-w-md text-sm text-zinc-500">
                        Start with a suggestion below—messages will appear here after you send.
                      </p>
                    </div>

                    {QuickActionsPanel}
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
                          className={isUser ? "flex justify-end" : "flex justify-start"}
                        >
                          <div
                            className={
                              isUser
                                ? "max-w-[85%] sm:max-w-[75%] rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3 min-w-0"
                                : "max-w-[85%] sm:max-w-[75%] rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 min-w-0"
                            }
                          >
                            <div className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap break-words overflow-hidden">
                              {isUser ? content : <AiMarkdownMessage content={content} />}
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

                <div ref={chatScrollRef} />
              </div>

              {/* Fixed input at bottom (inside panel) */}
              <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/80 px-3 sm:px-4 py-3 pb-[env(safe-area-inset-bottom)]">

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
                        const clipped = next.slice(0, 6000);
                        setInput(clipped);
                      }}
                      placeholder="Ask a question…"
                      disabled={loading}
                      rows={1}
                      className="w-full min-w-0 resize-none rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          void onSubmit();
                        }
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>
                        {safeTrim(input).length > 0
                          ? `${safeTrim(input).length} chars`
                          : ""}
                      </span>
                      <span className="tabular-nums">Max 6000</span>
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
    </div>
  );
}

