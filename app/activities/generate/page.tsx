import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { GenerateForm } from "./GenerateForm";

// Read ANTHROPIC_API_KEY at request time, not build time.
export const dynamic = "force-dynamic";

export default function GeneratePage() {
  const configured = isAnthropicConfigured();

  return (
    <main className="min-h-screen">
      <header className="max-w-2xl mx-auto px-6 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition"
        >
          <ArrowLeft className="w-4 h-4" /> My activities
        </Link>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-1">Generate with Claude</h1>
        <p className="text-muted text-sm mb-8">
          Describe the activity in plain English. Claude builds it and wires up
          any data collection for you — no HTML needed.
        </p>

        {configured ? (
          <GenerateForm />
        ) : (
          <div className="rounded-cozy border border-border bg-surface p-6 text-sm">
            <p className="mb-3">
              AI generation isn&apos;t set up yet. Add{" "}
              <code>ANTHROPIC_API_KEY</code> to your <code>.env.local</code> and
              restart the server.
            </p>
            <Link
              href="/activities/new"
              className="inline-flex items-center gap-1.5 text-accent hover:underline"
            >
              <Upload className="w-4 h-4" /> Upload an HTML file instead
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
