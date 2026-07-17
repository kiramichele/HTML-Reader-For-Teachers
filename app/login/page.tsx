import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="max-w-5xl w-full mx-auto px-6 py-6">
        <Link href="/" className="font-semibold text-lg">
          📎 Share &amp; Collect
        </Link>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <h1 className="text-2xl font-semibold mb-1">Welcome, teacher</h1>
        <p className="text-muted text-sm mb-8">
          Sign in to upload activities and see student data.
        </p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
