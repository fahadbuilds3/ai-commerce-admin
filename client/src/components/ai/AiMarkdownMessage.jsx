import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

function safeString(value) {
  // Ensure markdown renderer never receives non-string.
  if (value === null || value === undefined) return "";
  return String(value);
}

function CopyButton({ code, className }) {
  const onCopy = async () => {
    const text = safeString(code);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {
      // fall through to textarea fallback
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      // silent failure (no backend changes, keep lightweight)
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        className ||
        "btn btn-secondary h-8 shrink-0 rounded-lg px-2.5 text-[11px]"
      }
      aria-label="Copy code"
      title="Copy code"
    >
      Copy
    </button>
  );
}

export default function AiMarkdownMessage({ content }) {
  const value = useMemo(() => safeString(content), [content]);

  return (
    <div className="break-words text-sm leading-relaxed text-slate-900 dark:text-slate-100">
      <ReactMarkdown
        // Defensive: disable raw HTML injection
        skipHtml={true}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        // Keep text wrapping predictable
        components={{
          p: ({ node, ...props }) => (
            <p
              {...props}
              className={
                "mt-0 mb-2 last:mb-0 leading-relaxed break-words"
              }
            />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-indigo-700 underline underline-offset-2 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
              target="_blank"
              rel="noreferrer"
            />
          ),
          code: ({ inline, className, children, ...props }) => {
            // Inline code
            if (inline) {
              return (
                <code
                  {...props}
                  className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[0.95em] text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-200"
                >
                  {children}
                </code>
              );
            }

            // Fenced code blocks come through here as inline={false}
            const language =
              typeof className === "string" && className.startsWith("language-")
                ? className.replace("language-", "")
                : "";
            const codeText = safeString(children);

            return (
              <div className="not-prose mt-2 mb-2">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {language ? language : "code"}
                    </span>
                  </div>
                  <CopyButton code={codeText} />
                </div>
                <pre
                  className={
                    "overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-[12px] leading-snug text-slate-100 dark:border-slate-700"
                  }
                >
                  <code className={className} {...props}>
                    {codeText}
                  </code>
                </pre>
              </div>
            );
          },
          ul: ({ node, ...props }) => (
            <ul {...props} className="mb-2 ml-5 list-disc">
              {props.children}
            </ul>
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="mb-2 ml-5 list-decimal">
              {props.children}
            </ol>
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="mb-1">
              {props.children}
            </li>
          ),
          h1: ({ node, ...props }) => (
            <h1 {...props} className="mt-2 mb-2 text-lg font-bold">
              {props.children}
            </h1>
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="mt-2 mb-2 text-base font-bold">
              {props.children}
            </h2>
          ),
          h3: ({ node, ...props }) => (
            <h3 {...props} className="mt-2 mb-2 text-[15px] font-semibold">
              {props.children}
            </h3>
          ),
          hr: ({ node, ...props }) => (
            <hr
              {...props}
              className="my-3 border-slate-200 dark:border-slate-700"
            />
          ),
        }}
      >{value}</ReactMarkdown>
    </div>
  );
}

