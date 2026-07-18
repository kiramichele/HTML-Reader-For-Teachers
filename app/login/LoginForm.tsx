"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type AuthState } from "./actions";

const initialState: AuthState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition disabled:opacity-50"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div className="w-full max-w-sm">
      <div className="flex rounded-cozy border border-border overflow-hidden mb-6 text-sm">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 py-2 transition ${
            mode === "signin"
              ? "bg-accent text-accent-ink"
              : "bg-surface text-muted"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 transition ${
            mode === "signup"
              ? "bg-accent text-accent-ink"
              : "bg-surface text-muted"
          }`}
        >
          Create account
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div>
          <label className="block text-sm mb-1.5 text-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-3 py-2.5 rounded-cozy border border-border bg-surface outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-muted" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-cozy border border-border bg-surface outline-none focus:border-accent"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        ) : null}

        {mode === "signup" ? (
          <p className="text-xs text-muted leading-relaxed">
            Free for 30 days. After that, <strong>AI generation</strong> is{" "}
            <strong>$10/month</strong> — the Claude AI runs aren&apos;t free, so
            the subscription covers them. Everything else (uploading your own
            HTML, sharing, join codes, collecting student data) stays free.
          </p>
        ) : null}

        <SubmitButton label={mode === "signin" ? "Sign in" : "Create account"} />
      </form>
    </div>
  );
}
