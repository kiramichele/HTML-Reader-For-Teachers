"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Save, AlertCircle } from "lucide-react";
import type { Json } from "@/types/database";
import { saveResponse, loadResponse } from "../actions";

const SAVE_DEBOUNCE_MS = 800;

type StardropMessage =
  | { type: "stardrop:ready" }
  | { type: "stardrop:progress" | "stardrop:complete"; data: Json | null };

function isStardropMessage(msg: unknown): msg is StardropMessage {
  if (!msg || typeof msg !== "object") return false;
  const t = (msg as { type?: unknown }).type;
  return (
    t === "stardrop:ready" ||
    t === "stardrop:progress" ||
    t === "stardrop:complete"
  );
}

export function Player({
  slug,
  html,
  title,
  closed = false,
}: {
  slug: string;
  html: string;
  title: string;
  closed?: boolean;
}) {
  const [name, setName] = useState("");
  const [entered, setEntered] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [done, setDone] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const dataRef = useRef<Json | null>(null);
  const initialDataRef = useRef<Json | null>(null);
  const nameRef = useRef("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remember the name locally so a returning student edits the same record.
  useEffect(() => {
    const saved = localStorage.getItem(`sc:name:${slug}`);
    if (saved) setName(saved);
  }, [slug]);

  async function handleEnter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    nameRef.current = trimmed;
    localStorage.setItem(`sc:name:${slug}`, trimmed);

    // Pull any previous answers so we can hand them to the activity on init.
    const { data } = await loadResponse({ slug, studentName: trimmed });
    initialDataRef.current = data;
    dataRef.current = data;
    setEntered(true);
  }

  function persist(status: "draft" | "complete", immediate = false) {
    if (closed) return; // activity closed — don't save (server ignores it too)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const run = async () => {
      setSaveState("saving");
      const res = await saveResponse({
        slug,
        studentName: nameRef.current,
        status,
        data: dataRef.current,
      });
      if (res.ok) {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } else {
        setSaveState("error");
      }
    };
    if (immediate) run();
    else saveTimerRef.current = setTimeout(run, SAVE_DEBOUNCE_MS);
  }

  useEffect(() => {
    if (!entered) return;

    function handleMessage(event: MessageEvent) {
      // Only accept messages from our own iframe.
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isStardropMessage(event.data)) return;
      const msg = event.data;

      if (msg.type === "stardrop:ready") {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "stardrop:init",
            initialData: initialDataRef.current,
            readOnly: false,
          },
          "*"
        );
        return;
      }

      if (msg.type === "stardrop:progress") {
        dataRef.current = msg.data;
        persist("draft");
        return;
      }

      if (msg.type === "stardrop:complete") {
        dataRef.current = msg.data;
        setDone(true);
        persist("complete", true);
        return;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered, slug]);

  if (!entered) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm font-mono uppercase tracking-widest text-accent mb-3">
            Activity
          </p>
          <h1 className="text-2xl font-semibold mb-2">{title}</h1>
          <p className="text-muted text-sm mb-8">
            Type your name so your teacher can see your work.
          </p>
          <form onSubmit={handleEnter} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={80}
              className="w-full px-3 py-2.5 rounded-cozy border border-border bg-surface outline-none focus:border-accent text-center"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition"
            >
              Start
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-surface text-sm">
        <span className="truncate">
          <span className="text-muted">Working as</span>{" "}
          <span className="font-medium">{nameRef.current}</span>
        </span>
        <span className="min-w-[5rem] text-right">
          {closed && <span className="text-muted">Responses closed</span>}
          {!closed && saveState === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <Save className="w-3.5 h-3.5 animate-pulse" /> Saving…
            </span>
          )}
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1.5 text-sage">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveState === "error" && (
            <span className="inline-flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" /> Not saved
            </span>
          )}
          {!closed && saveState === "idle" && done && (
            <span className="text-sage">All done ✓</span>
          )}
        </span>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        title={title}
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}
