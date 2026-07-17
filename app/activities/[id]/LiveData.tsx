"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, CircleCheck, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export type ResponseRow = {
  id: string;
  student_name: string;
  structured_data: Json | null;
  status: "draft" | "complete";
  updated_at: string;
};

type Item = { id: string; prompt: string; type?: string; answer: string };

// Pull the [{id, prompt, type, answer}] list out of a student's saved blob.
function itemsOf(data: Json | null): Item[] {
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

export function LiveData({
  activityId,
  initial,
}: {
  activityId: string;
  initial: ResponseRow[];
}) {
  const [rows, setRows] = useState<ResponseRow[]>(initial);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`responses:${activityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "responses",
          filter: `activity_id=eq.${activityId}`,
        },
        (payload) => {
          const row = payload.new as ResponseRow;
          if (!row?.id) return;
          setRows((prev) => {
            const next = prev.filter((r) => r.id !== row.id);
            next.unshift(row);
            return next;
          });
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId]);

  // Group every answer under its prompt -> one "word wall" per question.
  const walls = useMemo(() => {
    const map = new Map<
      string,
      { prompt: string; answers: { name: string; answer: string }[] }
    >();
    // Keep prompt order stable by walking the most-complete blob first.
    for (const row of rows) {
      for (const item of itemsOf(row.structured_data)) {
        if (!item.answer.trim()) continue;
        if (!map.has(item.id)) map.set(item.id, { prompt: item.prompt, answers: [] });
        map.get(item.id)!.answers.push({
          name: row.student_name,
          answer: item.answer,
        });
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const completeCount = rows.filter((r) => r.status === "complete").length;

  return (
    <div>
      <div className="flex items-center gap-4 mb-5 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Users className="w-4 h-4 text-accent" />
          <span className="font-medium">{rows.length}</span>
          <span className="text-muted">
            {rows.length === 1 ? "student" : "students"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CircleCheck className="w-4 h-4 text-sage" />
          <span className="font-medium">{completeCount}</span>
          <span className="text-muted">finished</span>
        </span>
        <span
          className={`inline-flex items-center gap-1.5 ml-auto text-xs ${
            live ? "text-sage" : "text-faint"
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> {live ? "Live" : "Connecting…"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-cozy border border-dashed border-border p-10 text-center text-muted text-sm">
          No responses yet. When a student opens the link and starts typing,
          their answers appear here — live.
        </div>
      ) : (
        <div className="space-y-5">
          {walls.map((wall, i) => (
            <div
              key={i}
              className="rounded-cozy border border-border bg-surface p-5"
            >
              <h3 className="text-sm font-medium text-muted mb-3">
                {wall.prompt}
                <span className="text-faint font-normal">
                  {" "}
                  · {wall.answers.length}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {wall.answers.map((a, j) => (
                  <span
                    key={j}
                    title={`${a.name}: ${a.answer}`}
                    className="inline-block max-w-full px-3 py-1.5 rounded-full bg-background border border-border text-sm"
                  >
                    <span className="text-faint text-xs mr-1.5">{a.name}</span>
                    <span className="break-words">{a.answer}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}

          <details className="rounded-cozy border border-border bg-surface p-5">
            <summary className="text-sm font-medium text-muted cursor-pointer">
              See responses by student ({rows.length})
            </summary>
            <ul className="mt-4 space-y-4">
              {rows.map((row) => (
                <li key={row.id} className="border-t border-border pt-3">
                  <p className="font-medium text-sm mb-1.5">
                    {row.student_name}
                    {row.status === "complete" && (
                      <span className="ml-2 text-xs text-sage">finished</span>
                    )}
                  </p>
                  <ul className="space-y-1.5">
                    {itemsOf(row.structured_data).map((item, k) => (
                      <li key={k} className="text-sm">
                        <span className="text-faint">{item.prompt}: </span>
                        <span>{item.answer || "—"}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}
