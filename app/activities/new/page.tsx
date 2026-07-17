import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadForm } from "./UploadForm";

export default function NewActivityPage() {
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
      <div className="max-w-md mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-1">New activity</h1>
        <p className="text-muted text-sm mb-2">
          Upload the HTML file you made with Claude.
        </p>
        <p className="text-sm mb-8">
          <Link href="/activities/generate" className="text-accent hover:underline">
            Or have Claude build one for you →
          </Link>
        </p>
        <UploadForm />
      </div>
    </main>
  );
}
