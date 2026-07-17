import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-mono uppercase tracking-widest text-accent mb-3">
        Not found
      </p>
      <h1 className="text-2xl font-semibold mb-2">
        We couldn&apos;t find that page
      </h1>
      <p className="text-muted text-sm mb-6">
        The link may be mistyped, or the activity may have been deleted.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-cozy bg-accent text-accent-ink font-medium hover:opacity-90 transition text-sm"
      >
        Go home
      </Link>
    </main>
  );
}
