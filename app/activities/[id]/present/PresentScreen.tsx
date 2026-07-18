"use client";

import { useState } from "react";
import { QrCode, BarChart3 } from "lucide-react";
import { ResultsBoard } from "../ResultsBoard";
import type { ResponseRow } from "../LiveData";

export function PresentScreen({
  title,
  code,
  joinHost,
  qrSvg,
  activityId,
  collectData,
  initialRows,
}: {
  title: string;
  code: string;
  joinHost: string;
  qrSvg: string;
  activityId: string;
  collectData: boolean;
  initialRows: ResponseRow[];
}) {
  const [tab, setTab] = useState<"join" | "results">("join");

  return (
    <div className="flex-1 flex flex-col px-6 pb-16">
      <h1 className="text-2xl sm:text-3xl font-semibold text-center text-muted mb-5">
        {title}
      </h1>

      {collectData && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-cozy border border-border overflow-hidden text-sm">
            <button
              onClick={() => setTab("join")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 transition ${
                tab === "join" ? "bg-accent text-accent-ink" : "bg-surface text-muted"
              }`}
            >
              <QrCode className="w-4 h-4" /> Join code
            </button>
            <button
              onClick={() => setTab("results")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 transition ${
                tab === "results"
                  ? "bg-accent text-accent-ink"
                  : "bg-surface text-muted"
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Live results
            </button>
          </div>
        </div>
      )}

      {tab === "join" || !collectData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-lg sm:text-xl text-muted mb-8">
            Join at <span className="font-semibold text-ink">{joinHost}</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-14">
            <div>
              <p className="text-sm uppercase tracking-widest text-muted mb-2">
                Class code
              </p>
              <p className="font-mono font-bold tracking-[0.15em] text-5xl sm:text-7xl">
                {code}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div
                className="bg-white p-3 rounded-cozy border border-border"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="text-sm text-muted mt-2">Scan to join</p>
            </div>
          </div>
        </div>
      ) : (
        <ResultsBoard activityId={activityId} initial={initialRows} />
      )}
    </div>
  );
}
