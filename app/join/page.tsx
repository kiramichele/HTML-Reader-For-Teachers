import { JoinForm } from "./JoinForm";

export const dynamic = "force-dynamic";

export default function JoinPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-mono uppercase tracking-widest text-accent mb-3">
        Join your class
      </p>
      <h1 className="text-3xl font-semibold mb-2">Enter your class code</h1>
      <p className="text-muted text-sm mb-8">
        Your teacher will show it on the board. Or scan the QR code to skip this.
      </p>
      <JoinForm />
    </main>
  );
}
