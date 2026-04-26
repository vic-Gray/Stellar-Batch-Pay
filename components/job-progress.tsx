"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { JobStatus, BatchResult } from "@/lib/stellar/types";

interface JobProgressProps {
  status: JobStatus;
  completedBatches: number;
  totalBatches: number;
  totalPayments: number;
  jobState?: {
    result?: BatchResult;
  };
}

export function JobProgress({
  status,
  completedBatches,
  totalBatches,
  totalPayments,
  jobState,
}: JobProgressProps) {
  const percent =
    totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;

  const isQueued = status === "queued";
  const isProcessing = status === "processing";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {(isQueued || isProcessing) && (
          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
        )}
        {isCompleted && (
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        )}
        {isFailed && <XCircle className="w-5 h-5 text-destructive shrink-0" />}

        <div className="min-w-0">
          {isQueued && (
            <p className="font-semibold text-muted-foreground">
              Queued — starting shortly…
            </p>
          )}
          {isProcessing && (
            <p className="font-semibold">
              Processing batch{" "}
              <span className="text-primary">{completedBatches}</span> of{" "}
              <span className="text-primary">{totalBatches}</span>
            </p>
          )}
          {isCompleted && (
            <p className="font-semibold text-green-600 dark:text-green-400">
              All {totalBatches} batch{totalBatches !== 1 ? "es" : ""}{" "}
              completed!
            </p>
          )}
          {isFailed && (
            <p className="font-semibold text-destructive">Processing failed</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalPayments} payment{totalPayments !== 1 ? "s" : ""} ·{" "}
            {totalBatches > 0
              ? `${totalBatches} Stellar transaction${totalBatches !== 1 ? "s" : ""}`
              : "Calculating…"}
          </p>
        </div>
      </div>

      {/* Progress bar — hidden while queued and totalBatches unknown */}
      {!isQueued && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Progress
              value={isCompleted ? 100 : percent}
              className={`h-3 transition-all duration-500 rounded-full bg-gray-800 ${
                isCompleted
                  ? "[&>div]:bg-green-500"
                  : isFailed
                    ? "[&>div]:bg-destructive"
                    : "[&>div]:bg-[#00D98B]"
              }`}
            />
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>{isCompleted ? 100 : percent}% Complete</span>
              <span>
                {completedBatches} / {totalBatches} Transactions
              </span>
            </div>
          </div>

          {/* Results Summary (if available) */}
          {status === "completed" && jobState?.result && (
            <div className="pt-2 border-t border-gray-800 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex gap-4 text-sm mb-4">
                <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                  {jobState.result.summary.successful} Successful
                </div>
                {jobState.result.summary.failed > 0 && (
                  <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                    {jobState.result.summary.failed} Failed
                  </div>
                )}
              </div>
              
              {/* Optional: Show last 3 results for immediate feedback */}
              <div className="space-y-2">
                {jobState.result.results.slice(-3).map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-gray-400 truncate max-w-[120px]">{r.recipient}</span>
                    <span className={r.status === "success" ? "text-green-500" : "text-red-500"}>
                      {r.status === "success" ? "✓ Confirmed" : "✗ Failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
