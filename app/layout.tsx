import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Share & Collect — interactive HTML for classrooms",
  description:
    "Upload an interactive HTML activity, get a link for students, and watch their answers come in live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
