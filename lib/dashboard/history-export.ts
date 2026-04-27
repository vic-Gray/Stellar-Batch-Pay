import type { BatchResult } from "@/lib/stellar/types";

export interface ClaimExportRow {
  walletAddress: string;
  recipientAddress: string;
  token: string;
  amountClaimed: string;
  timestamp: string;
  transactionHash: string;
}

interface DateRange {
  from?: string;
  to?: string;
}

function normalizeDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toClaimExportRows(
  history: BatchResult[],
  walletAddress?: string | null
): ClaimExportRow[] {
  const owner = walletAddress?.trim() || "Unknown";

  return history
    .flatMap((batch) => {
      const ts = batch.submittedAt ?? batch.timestamp;
      return batch.results
        .filter((result) => result.status === "success")
        .map((result) => ({
          walletAddress: owner,
          recipientAddress: result.recipient,
          token: result.asset,
          amountClaimed: result.amount,
          timestamp: ts,
          transactionHash: result.transactionHash ?? "N/A",
        }));
    })
    .sort((a, b) => {
      const aTime = normalizeDate(a.timestamp)?.getTime() ?? 0;
      const bTime = normalizeDate(b.timestamp)?.getTime() ?? 0;
      return bTime - aTime;
    });
}

export function filterClaimExportRowsByDateRange(
  rows: ClaimExportRow[],
  range: DateRange
): ClaimExportRow[] {
  if (!range.from && !range.to) {
    return rows;
  }

  const fromDate = range.from ? normalizeDate(`${range.from}T00:00:00.000Z`) : null;
  const toDate = range.to ? normalizeDate(`${range.to}T23:59:59.999Z`) : null;

  return rows.filter((row) => {
    const rowDate = normalizeDate(row.timestamp);
    if (!rowDate) {
      return false;
    }
    if (fromDate && rowDate < fromDate) {
      return false;
    }
    if (toDate && rowDate > toDate) {
      return false;
    }
    return true;
  });
}

function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function toClaimExportCsv(rows: ClaimExportRow[]): string {
  const header = [
    "Wallet Address",
    "Recipient Address",
    "Token",
    "Amount Claimed",
    "Timestamp",
    "Transaction Hash",
  ];

  const dataLines = rows.map((row) =>
    [
      row.walletAddress,
      row.recipientAddress,
      row.token,
      row.amountClaimed,
      row.timestamp,
      row.transactionHash,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  return [header.join(","), ...dataLines].join("\n");
}
