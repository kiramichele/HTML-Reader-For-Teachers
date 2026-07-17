"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

export function ShareLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(`/p/${slug}`);

  // Build the absolute URL on the client so it works on any deploy host.
  useEffect(() => {
    setUrl(`${window.location.origin}/p/${slug}`);
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the field is selectable as a fallback */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 px-3 py-2 rounded-cozy border border-border bg-background text-sm font-mono outline-none"
      />
      <button
        onClick={copy}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-cozy bg-accent text-accent-ink text-sm font-medium hover:opacity-90 transition"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" /> Copy
          </>
        )}
      </button>
    </div>
  );
}
