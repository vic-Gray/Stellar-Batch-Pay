import { useState, useEffect } from "react";
import type { JobStatus, BatchResult } from "@/lib/stellar/types";

export interface JobState {
  status: JobStatus;
  totalBatches: number;
  completedBatches: number;
  totalPayments: number;
  result?: BatchResult;
  error?: string;
}

export function useBatchPolling(jobId: string | null) {
  const [jobState, setJobState] = useState<JobState | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJobState(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const response = await fetch(`/api/batch-status/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job status");
        
        const data = await response.json();
        setJobState(data);

        if (data.status === "completed" || data.status === "failed") {
          setIsPolling(false);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Polling error:", error);
        setIsPolling(false);
        clearInterval(intervalId);
      }
    };

    // Poll every 2 seconds
    poll();
    intervalId = setInterval(poll, 2000);

    return () => clearInterval(intervalId);
  }, [jobId]);

  return { jobState, isPolling };
}
