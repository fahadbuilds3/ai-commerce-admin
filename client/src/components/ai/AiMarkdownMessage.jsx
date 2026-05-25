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
        "shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-900/70 hover:border-zinc-700 transition"
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
    <div className="text-sm leading-relaxed text-zinc-100 break-words">
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
              className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
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
                  className="px-1.5 py-0.5 rounded bg-zinc-900/60 border border-zinc-800 text-[0.95em] text-indigo-200"
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
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {language ? language : "code"}
                    </span>
                  </div>
                  <CopyButton code={codeText} />
                </div>
                <pre
                  className={
                    "overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-[12px] leading-snug"
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
              className="my-3 border-zinc-800"
            />
          ),
        }}
      >{value}</ReactMarkdown>
    </div>
  );
}

