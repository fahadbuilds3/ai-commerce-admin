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
      "Summarize yesterday's sales performance",
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
    <div className="surface-card p-4">
      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300">
          <Clock3 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Conversation history</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
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
          className="btn btn-secondary h-9 shrink-0 px-3 text-xs"
          disabled={loading}
        >
          New Chat
        </button>
      </div>

      {historyError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          {historyError}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {historyLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
            className="surface-subtle px-3 py-2"
            >
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
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
                      ? "border-blue-200 bg-blue-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:hover:bg-slate-800")
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
                    className="group w-full rounded-xl px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-400/30"
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
                              className="control-input h-9 rounded-lg"
                            />
                          </div>
                        ) : (
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {title}
                          </p>
                        )}

                        <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
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
                                className="btn btn-primary h-8 rounded-lg px-2 text-xs"
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
                                className="btn btn-secondary h-8 rounded-lg px-2 text-xs"
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
                                className="icon-button h-8 w-8"
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
                                className="icon-button icon-button-danger h-8 w-8"
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
                          <p className="text-[12px] text-red-600 dark:text-rose-200">
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
                              className="btn btn-danger h-8 rounded-lg px-3 text-[12px]"
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
                              className="btn btn-secondary h-8 rounded-lg px-3 text-[12px]"
                              disabled={deleteSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : preview ? (
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {preview}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No messages</p>
                      )}
                    </div>
                  </button>
                </div>
              );

            })}

          </div>
        ) : (
          <div className="surface-subtle px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
            Start a conversation to see it appear here.
          </div>
        )}
      </div>
    </div>
  );

  const QuickActionsPanel = (
    <div className="mt-4 w-full max-w-xl">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Quick Actions
        </div>

        {/* Mobile-only compact toggle */}
        <button
          type="button"
          onClick={() => setActionsCollapsed((v) => !v)}
          className={
            "btn btn-secondary h-9 shrink-0 px-3 text-xs lg:hidden"
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
                <div className="text-sm font-semibold text-slate-950 dark:text-white">{cat.category}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    className="btn-secondary min-w-0 rounded-xl border px-3 py-2 text-left shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-blue-400/30"
                  >
                    <div className="flex items-start gap-2">
                      <div className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 p-1 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                        <Sparkles className="h-4 w-4 text-blue-700 dark:text-indigo-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-950 dark:text-white">
                          {t?.title}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 break-words">
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
                    className="btn-secondary rounded-xl border px-3 py-2 text-left shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-blue-400/30"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                      <span className="text-sm font-medium text-slate-950 dark:text-white">Use prompt</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 break-words">
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
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <div className="mb-3 hidden shrink-0 sm:mb-5 sm:block">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          AI Assistant
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Your ecommerce operations assistant for inventory, orders, analytics, and customer workflows.
        </p>
      </div>


      {/* Mobile/tablet history drawer + desktop fixed sidebar */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Backdrop */}
        {historyOpen ? (
          <div
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm dark:bg-slate-900/60"
            onClick={() => setHistoryOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        <div className="grid h-full min-h-0 min-w-0 grid-cols-1 gap-3 overflow-hidden sm:gap-4 lg:grid-cols-[320px_1fr] lg:gap-6">
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
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">History</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="icon-button shrink-0 rounded-xl"
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
          <section className="surface-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            {/* Top bar with mobile history button */}
            <div className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-3 py-2 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/90 sm:py-3">
              <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-950 dark:text-white sm:text-[13px]">AI Assistant</div>
              </div>


              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="btn btn-secondary px-3 lg:hidden"
                disabled={loading}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </button>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {/* Scrollable message area (single overflow-y container) */}
              <div
                ref={chatScrollRef}
                className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-3 sm:px-5"
              >
                {!hasMessages ? (


                  <div className="flex flex-col items-center justify-center text-center h-full px-2">
                    <div className="surface-panel p-4">
                      <div className="flex items-center justify-center">
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-2.5 text-blue-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <Bot className="h-5 w-5" />
                        </div>
                      </div>
                      <h2 className="mt-3 text-base font-semibold text-slate-950 dark:text-white">
                        Ask anything about your business
                      </h2>
                      <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Start with a suggestion below; messages will appear here after you send.
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
                                ? "max-w-[85%] sm:max-w-[75%] rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 min-w-0 dark:border-indigo-500/25 dark:bg-indigo-500/10"
                                : "max-w-[85%] sm:max-w-[75%] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 min-w-0 dark:border-slate-700 dark:bg-slate-800/40"
                            }
                          >
                            <div className="overflow-hidden whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-900 dark:text-white">
                              {isUser ? content : <AiMarkdownMessage content={content} />}
                            </div>

                            {time ? (
                              <div
                                className={
                                  isUser
                                    ? "mt-2 flex items-center justify-end gap-2 text-[11px] text-blue-700/70 dark:text-indigo-200/70"
                                    : "mt-2 flex items-center justify-start gap-2 text-[11px] text-slate-500 dark:text-slate-400"
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
                        <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40 sm:max-w-[75%]">
                          <div className="flex items-center gap-2">
                            <div className="rounded-full border border-emerald-200 bg-emerald-50 p-1 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                              <Bot className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-200">Thinking…</div>
                          </div>
                          <div className="mt-2 h-2 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700/80" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

              </div>

              {/* Fixed input at bottom (inside panel) */}
              <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-100 bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:px-4">

                <form
                  className="flex min-w-0 items-start gap-2 sm:gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void onSubmit();
                  }}
                >
                  <div className="min-w-0 flex-1">
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
                      placeholder="Ask a question..."
                      disabled={loading}
                      rows={1}
                      className="control-textarea block min-h-[46px] min-w-0 resize-none rounded-2xl px-4 py-3 leading-5"
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          void onSubmit();
                        }
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
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
                    className="btn btn-primary h-[46px] w-[46px] shrink-0 rounded-2xl px-0 sm:w-auto sm:px-4"
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

