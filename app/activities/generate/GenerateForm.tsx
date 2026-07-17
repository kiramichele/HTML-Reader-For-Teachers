"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Sparkles, Database, RefreshCw, Check } from "lucide-react";
import {
  generateActivityDraft,
  saveGeneratedActivity,
  type GenerateState,
} from "../actions";

const initialState: GenerateState = { status: "idle" };

const EXAMPLES = [
  "A water-cycle warm-up that collects each student's prediction and one question they have",
  "An exit ticket: one word for how class felt, one thing learned, one question left",
  "A 5-slide intro to photosynthesis — just a slideshow, no data collected",
  "A vocabulary word wall where students submit a sentence using this week's word",
];

function GenerateButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition disabled:opacity-60"
    >
      <Sparkles className="w-4 h-4" />
      {pending ? "Claude is building it…" : label}
    </button>
  );
}

export function GenerateForm() {
  const [state, formAction] = useActionState(generateActivityDraft, initialState);
  const [prompt, setPrompt] = useState("");

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-3">
        <textarea
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          required
          minLength={4}
          maxLength={4000}
          placeholder="Describe the activity you want…"
          className="w-full px-3 py-2.5 rounded-cozy border border-border bg-surface outline-none focus:border-accent resize-y"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="text-left text-xs px-3 py-1.5 rounded-full border border-border bg-surface text-muted hover:border-accent transition"
            >
              {ex.length > 54 ? ex.slice(0, 54) + "…" : ex}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <GenerateButton
            label={state.status === "ready" ? "Regenerate" : "Generate activity"}
          />
          {state.status === "error" && (
            <span className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </span>
          )}
        </div>
      </form>

      {state.status === "ready" && (
        <Preview
          key={state.activity.html.length + state.activity.title}
          activity={state.activity}
        />
      )}
    </div>
  );
}

function Preview({
  activity,
}: {
  activity: Extract<GenerateState, { status: "ready" }>["activity"];
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startSaving(async () => {
      const res = await saveGeneratedActivity({
        title: activity.title,
        html: activity.html,
        collectData: activity.collectsData,
      });
      if (res.ok && res.id) router.push(`/activities/${res.id}`);
      else setError(res.error ?? "Couldn't save");
    });
  }

  return (
    <div className="rounded-cozy border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{activity.title}</h2>
        <span className="text-xs inline-flex items-center gap-1.5 text-muted">
          {activity.collectsData ? (
            <>
              <Database className="w-3.5 h-3.5" /> Collects data
            </>
          ) : (
            "Share only"
          )}
        </span>
      </div>

      <div className="rounded-cozy border border-border overflow-hidden bg-white">
        <PreviewFrame html={activity.html} title={activity.title} />
      </div>

      {activity.collectsData && activity.fields.length > 0 && (
        <div>
          <p className="text-sm text-muted mb-2">
            Claude will collect these from each student — check they look right:
          </p>
          <ul className="flex flex-wrap gap-2">
            {activity.fields.map((f) => (
              <li
                key={f.id}
                className="text-sm px-3 py-1.5 rounded-full bg-background border border-border"
              >
                {f.prompt}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition disabled:opacity-60"
        >
          {saving ? (
            "Saving…"
          ) : (
            <>
              <Check className="w-4 h-4" /> Save &amp; get link
            </>
          )}
        </button>
        <span className="text-sm text-muted inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Not right? Tweak the prompt above
          and Regenerate.
        </span>
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}

// Renders the generated HTML in a sandboxed srcdoc iframe and answers the
// stardrop:ready handshake so protocol-driven activities behave in preview.
function PreviewFrame({ html, title }: { html: string; title: string }) {
  return (
    <iframe
      title={`Preview — ${title}`}
      srcDoc={html}
      sandbox="allow-scripts allow-forms"
      onLoad={(e) => {
        const win = e.currentTarget.contentWindow;
        win?.postMessage(
          { type: "stardrop:init", initialData: null, readOnly: false },
          "*"
        );
      }}
      className="w-full border-0"
      style={{ height: "60vh" }}
    />
  );
}
