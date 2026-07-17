"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UploadCloud } from "lucide-react";
import { createActivity, type CreateState } from "../actions";

const initialState: CreateState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition disabled:opacity-50"
    >
      {pending ? "Uploading…" : "Create activity & get link"}
    </button>
  );
}

export function UploadForm() {
  const [state, formAction] = useActionState(createActivity, initialState);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block text-sm mb-1.5 text-muted" htmlFor="title">
          Activity title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Cover Letter & Portfolio"
          className="w-full px-3 py-2.5 rounded-cozy border border-border bg-surface outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1.5 text-muted" htmlFor="file">
          HTML file
        </label>
        <label
          htmlFor="file"
          className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-cozy border-2 border-dashed border-border bg-surface cursor-pointer hover:border-accent transition text-center"
        >
          <UploadCloud className="w-7 h-7 text-faint" />
          <span className="text-sm text-muted">
            {fileName ?? "Click to choose your .html file"}
          </span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".html,.htm,text/html"
          required
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm text-muted mb-1.5">
          What kind of activity is this?
        </legend>
        <label className="flex items-start gap-3 p-3 rounded-cozy border border-border bg-surface cursor-pointer has-[:checked]:border-accent">
          <input
            type="radio"
            name="collect_data"
            value="yes"
            defaultChecked
            className="mt-1"
          />
          <span>
            <span className="block font-medium">
              Collect student answers
            </span>
            <span className="block text-sm text-muted">
              Interactive activity — students type their name and their work
              saves to your dashboard.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 p-3 rounded-cozy border border-border bg-surface cursor-pointer has-[:checked]:border-accent">
          <input type="radio" name="collect_data" value="no" className="mt-1" />
          <span>
            <span className="block font-medium">
              Just share it (no data saved)
            </span>
            <span className="block text-sm text-muted">
              A slideshow or reference — students open the link, nothing is
              collected.
            </span>
          </span>
        </label>
      </fieldset>

      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
