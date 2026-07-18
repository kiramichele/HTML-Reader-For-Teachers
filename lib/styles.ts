// Visual style presets for "Generate with Claude". Kept in their own module
// (no server-only imports) so the client form can import the list safely.
// Each hint is a short aesthetic nudge appended to the generation prompt.

export type ActivityStyle = { id: string; label: string; hint: string };

export const STYLES: ActivityStyle[] = [
  { id: "auto", label: "Surprise me", hint: "" },
  {
    id: "playful",
    label: "Playful",
    hint: "Playful and energetic: bright rounded shapes, a friendly sans-serif, cheerful colors, and tasteful emoji accents.",
  },
  {
    id: "clean",
    label: "Clean & minimal",
    hint: "Clean and minimal: lots of whitespace, a restrained neutral palette, simple typography, and understated details.",
  },
  {
    id: "bold",
    label: "Bold & colorful",
    hint: "Bold and high-energy: vivid high-contrast colors, large confident headings, and strong accent blocks.",
  },
  {
    id: "warm",
    label: "Warm & cozy",
    hint: "Warm and cozy: soft cream and earth tones, rounded corners, gentle shadows, and an inviting feel.",
  },
  {
    id: "academic",
    label: "Academic",
    hint: "Academic and focused: a calm muted palette, serif headings, clear hierarchy, and highly legible layout.",
  },
];

export function styleHint(id: string | null | undefined): string {
  return STYLES.find((s) => s.id === id)?.hint ?? "";
}
