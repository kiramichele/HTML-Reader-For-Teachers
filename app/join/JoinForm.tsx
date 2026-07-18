"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { joinByCode, type JoinState } from "./actions";

const initialState: JoinState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-cozy bg-accent text-accent-ink font-semibold text-lg hover:opacity-90 transition disabled:opacity-60"
    >
      {pending ? "Joining…" : "Join"}
    </button>
  );
}

export function JoinForm() {
  const [state, formAction] = useActionState(joinByCode, initialState);

  return (
    <form action={formAction} className="w-full max-w-xs space-y-3">
      <input
        name="code"
        type="text"
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="Class code"
        aria-label="Class code"
        className="w-full px-4 py-3 rounded-cozy border border-border bg-surface outline-none focus:border-accent text-center text-2xl font-mono tracking-[0.3em] uppercase"
      />
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
