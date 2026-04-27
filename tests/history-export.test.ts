import {
  filterClaimExportRowsByDateRange,
  toClaimExportCsv,
  toClaimExportRows,
} from "../lib/dashboard/history-export";
import type { BatchResult } from "../lib/stellar/types";

const historyFixture: BatchResult[] = [
  {
    batchId: "batch-1",
    totalRecipients: 2,
    totalAmount: "150",
    totalTransactions: 1,
    network: "testnet",
    timestamp: "2026-04-01T10:00:00.000Z",
    results: [
      {
        recipient: "GBRECIPIENTONE",
        amount: "100",
        asset: "XLM",
        status: "success",
        transactionHash: "hash-one",
      },
      {
        recipient: "GBRECIPIENTTWO",
        amount: "50",
        asset: "USDC:GDUKMGUGDZQK6YHCLWJYPP4AFSEMQON6U6XJUCWE3J6VQW7QZ6W5Q5TR",
        status: "failed",
      },
    ],
    summary: {
      successful: 1,
      failed: 1,
    },
  },
  {
    batchId: "batch-2",
    totalRecipients: 1,
    totalAmount: "25",
    totalTransactions: 1,
    network: "testnet",
    timestamp: "2026-04-10T10:00:00.000Z",
    results: [
      {
        recipient: "GBRECIPIENTTHREE",
        amount: "25",
        asset: "XLM",
        status: "success",
        transactionHash: "hash-two",
      },
    ],
    summary: {
      successful: 1,
      failed: 0,
    },
  },
];

describe("history export utilities", () => {
  test("maps successful history rows with token included", () => {
    const rows = toClaimExportRows(historyFixture, "GBWALLETOWNER");
    expect(rows).toHaveLength(2);
    expect(rows[0].token).toBe("XLM");
    expect(rows[0].walletAddress).toBe("GBWALLETOWNER");
    expect(rows[1].transactionHash).toBe("hash-one");
  });

  test("filters rows by inclusive date range", () => {
    const rows = toClaimExportRows(historyFixture, "GBWALLETOWNER");
    const filtered = filterClaimExportRowsByDateRange(rows, {
      from: "2026-04-08",
      to: "2026-04-11",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].recipientAddress).toBe("GBRECIPIENTTHREE");
  });

  test("serializes export rows to CSV with expected headers", () => {
    const rows = toClaimExportRows(historyFixture, "GBWALLETOWNER");
    const csv = toClaimExportCsv(rows);
    expect(csv).toContain("Wallet Address,Recipient Address,Token,Amount Claimed,Timestamp,Transaction Hash");
    expect(csv).toContain("GBRECIPIENTTHREE");
    expect(csv).toContain("hash-one");
  });
});
