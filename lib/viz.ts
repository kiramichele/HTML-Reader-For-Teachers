import type { Json } from "@/types/database";

// Shared response-visualization helpers, used by the teacher dashboard and the
// projectable live-results screen.

export type Item = { id: string; prompt: string; type?: string; answer: string };
export type Answer = { name: string; answer: string };
export type Question = { prompt: string; type?: string; answers: Answer[] };

// Pull the [{id, prompt, type, answer}] list out of a student's saved blob.
export function itemsOf(data: Json | null): Item[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const responses = (data as Record<string, Json | undefined>).responses;
  if (!Array.isArray(responses)) return [];
  const out: Item[] = [];
  for (const r of responses) {
    if (!r || typeof r !== "object" || Array.isArray(r)) continue;
    const o = r as Record<string, Json | undefined>;
    const id = typeof o.id === "string" ? o.id : "";
    const prompt = typeof o.prompt === "string" ? o.prompt : id;
    const answer =
      typeof o.answer === "string"
        ? o.answer
        : o.answer == null
          ? ""
          : String(o.answer);
    const type = typeof o.type === "string" ? o.type : undefined;
    if (id) out.push({ id, prompt, type, answer });
  }
  return out;
}

// Group every answer under its prompt -> one question card each.
export function groupQuestions(
  rows: { structured_data: Json | null; student_name: string }[]
): Question[] {
  const map = new Map<string, Question>();
  for (const row of rows) {
    for (const item of itemsOf(row.structured_data)) {
      if (!item.answer.trim()) continue;
      if (!map.has(item.id)) {
        map.set(item.id, { prompt: item.prompt, type: item.type, answers: [] });
      }
      map.get(item.id)!.answers.push({
        name: row.student_name,
        answer: item.answer.trim(),
      });
    }
  }
  return Array.from(map.values());
}

// Choice-style field types Claude (or an uploaded activity) may declare.
export function isChoiceType(t?: string): boolean {
  return !!t && /choice|radio|select|poll|multiple|option/i.test(t);
}

// Pick a visualization: a bar chart when answers cluster into a small set of
// options (a poll), otherwise a word wall for open-ended text.
export function chooseViz(q: Question): "bar" | "wall" {
  const vals = q.answers.map((a) => a.answer).filter(Boolean);
  if (vals.length === 0) return "wall";
  if (isChoiceType(q.type)) return "bar";

  const distinct = new Set(vals);
  const longest = vals.reduce((m, v) => Math.max(m, v.length), 0);
  const allShort = longest <= 40;
  const fewOptions = distinct.size <= 10;
  const hasRepeats = distinct.size < vals.length; // at least one option repeats
  return vals.length >= 3 && allShort && fewOptions && hasRepeats ? "bar" : "wall";
}

export function tally(answers: Answer[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of answers) counts.set(a.answer, (counts.get(a.answer) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
