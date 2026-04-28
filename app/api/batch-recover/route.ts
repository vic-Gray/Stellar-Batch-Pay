/**
 * API route for recovering failed batch operations (#276).
 *
 * GET /api/batch-recover?jobId=...
 *
 * Returns information about a previously submitted batch and identifies which
 * transactions failed or are still pending, allowing the user to retry only
 * the failed operations without risking double payments.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadBatch, getPendingTransactions } from "@/lib/batch-persistence";
import { safeJsonResponse } from "@/lib/safe-json";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 },
      );
    }

    // Load the batch from IndexedDB (stored client-side during submission)
    const batch = await loadBatch(jobId);

    if (!batch) {
      return safeJsonResponse(
        {
          error: "Batch not found",
          jobId,
        },
        { status: 404 },
      );
    }

    // Identify pending/failed transactions that need retry
    const pendingTransactions = getPendingTransactions(batch);
    const confirmedTransactions = batch.transactions.filter(
      (t) => t.status === "confirmed",
    );

    return safeJsonResponse({
      success: true,
      batch: {
        jobId: batch.jobId,
        network: batch.network,
        createdAt: batch.createdAt,
        totalPayments: batch.totalPayments,
      },
      progress: {
        total: batch.transactions.length,
        confirmed: confirmedTransactions.length,
        pending: pendingTransactions.length,
        percentComplete: Math.round(
          (confirmedTransactions.length / batch.transactions.length) * 100,
        ),
      },
      confirmedTransactions,
      pendingTransactions,
      ready: pendingTransactions.length > 0,
    });
  } catch (error: unknown) {
    console.error("Batch recovery error:", error);

    return safeJsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to recover batch information",
      },
      { status: 500 },
    );
  }
}
