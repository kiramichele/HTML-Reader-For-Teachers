"use client";

import { useState } from "react";
import { Copy, Check, Download, Sparkles } from "lucide-react";
import { CLAUDE_TEMPLATE } from "@/lib/claude-template";

// Shown on the upload page: instructions teachers paste to Claude (elsewhere)
// so their HTML collects student answers when uploaded here.
export function ClaudeTemplate() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CLAUDE_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the text is selectable in the box below */
    }
  }

  function download() {
    const blob = new Blob([CLAUDE_TEMPLATE], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "give-this-to-claude.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="rounded-cozy border border-border bg-surface mb-8">
      <summary className="cursor-pointer px-5 py-4 text-sm font-medium flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        Want it to collect student answers? Give Claude these instructions
      </summary>
      <div className="px-5 pb-5">
        <p className="text-sm text-muted mb-3">
          When you ask Claude (or another AI) to build your activity, paste this
          in with your request — or download it and upload it to Claude. It tells
          the AI how to wire the activity so answers save to your dashboard here.
          (Activities you make with <strong>Generate with Claude</strong> already
          do this automatically.)
        </p>

        <div className="flex gap-2 mb-3">
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cozy bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy instructions
              </>
            )}
          </button>
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-cozy border border-border bg-surface text-sm hover:border-accent transition"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>

        <pre className="text-xs whitespace-pre-wrap bg-background border border-border rounded-cozy p-3 max-h-72 overflow-auto text-muted">
          {CLAUDE_TEMPLATE}
        </pre>
      </div>
    </details>
  );
}
