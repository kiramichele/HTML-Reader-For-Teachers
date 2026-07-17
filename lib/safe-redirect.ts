// Only allow same-site, absolute-path redirects (e.g. "/dashboard").
// Prevents open-redirect via "next" params like "//evil.com" or "https://evil.com".
export function safeRedirectPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  return next;
}
