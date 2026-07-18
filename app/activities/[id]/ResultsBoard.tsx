"use client";

import { useEffect, useMemo, useState } from "react";
import { Radio, Users, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { groupQuestions, chooseViz, tally, type Question } from "@/lib/viz";
import type { ResponseRow } from "./LiveData";

// Projectable, live-updating results for the Present screen. Names are hidden
// by default (you're showing the whole class); a toggle reveals them.
export function ResultsBoard({
  activityId,
  initial,
}: {
  activityId: string;
  initial: ResponseRow[];
}) {
  const [rows, setRows] = useState<ResponseRow[]>(initial);
  const [live, setLive] = useState(false);
  const [showNames, setShowNames] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`present:${activityId}`)
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

  const questions = useMemo(() => groupQuestions(rows), [rows]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <span className="inline-flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-accent" />
          <span className="font-semibold">{rows.length}</span>
          <span className="text-muted">
            {rows.length === 1 ? "response" : "responses"}
          </span>
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNames((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition"
          >
            {showNames ? (
              <>
                <EyeOff className="w-4 h-4" /> Hide names
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Show names
              </>
            )}
          </button>
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              live ? "text-sage" : "text-faint"
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> {live ? "Live" : "Connecting…"}
          </span>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-cozy border border-dashed border-border p-16 text-center text-muted">
          Waiting for the first response…
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((q, i) => (
            <BigQuestion key={i} q={q} showNames={showNames} />
          ))}
        </div>
      )}
    </div>
  );
}

function BigQuestion({ q, showNames }: { q: Question; showNames: boolean }) {
  const viz = chooseViz(q);
  return (
    <div className="rounded-cozy border border-border bg-surface p-6">
      <h3 className="text-lg font-medium mb-4">
        {q.prompt}
        <span className="text-faint font-normal text-base"> · {q.answers.length}</span>
      </h3>
      {viz === "bar" ? <BigBars q={q} /> : <BigWall q={q} showNames={showNames} />}
    </div>
  );
}

function BigBars({ q }: { q: Question }) {
  const rows = tally(q.answers);
  const total = q.answers.length;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="space-y-3.5">
      {rows.map((r, i) => {
        const pct = Math.round((r.count / total) * 100);
        return (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="break-words text-lg">{r.label}</span>
              <span className="text-muted shrink-0 tabular-nums">
                {r.count} · {pct}%
              </span>
            </div>
            <div className="h-4 rounded-full bg-background overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BigWall({ q, showNames }: { q: Question; showNames: boolean }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {q.answers.map((a, i) => (
        <span
          key={i}
          className="inline-block max-w-full px-4 py-2 rounded-full bg-background border border-border text-lg"
        >
          {showNames && (
            <span className="text-faint text-sm mr-2">{a.name}</span>
          )}
          <span className="break-words">{a.answer}</span>
        </span>
      ))}
    </div>
  );
}
