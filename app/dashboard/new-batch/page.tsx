"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { parsePaymentFile } from "@/lib/stellar";
import type { ParsedPaymentFile } from "@/lib/stellar/types";
import {
  Send,
  Info,
  Lightbulb,
  Check,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default function NewBatchPaymentPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<"testnet" | "mainnet">(
    "testnet",
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<"json" | "csv" | null>(null);
  const [validationResult, setValidationResult] =
    useState<ParsedPaymentFile | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const handleFileSelect = async (
    selectedFile: File,
    format: "json" | "csv",
  ) => {
    setFile(selectedFile);
    setFileFormat(format);

    try {
      const content = await selectedFile.text();
      const parsed = parsePaymentFile(content, format);
      setValidationResult(parsed);
      setValidationError("");
    } catch (error) {
      setValidationResult(null);
      setValidationError(
        error instanceof Error ? error.message : "Failed to parse payment file",
      );
    }
  };

  const totalRecipients = validationResult?.rows.length ?? 0;
  const validPayments = validationResult?.validPayments.length ?? 0;
  const invalidPayments = validationResult?.invalidCount ?? 0;
  const estimatedFees = (validPayments * 0.00001).toFixed(5);
  const totalPayout = validationResult?.validPayments
    .reduce((sum, payment) => sum + parseFloat(payment.amount || "0"), 0)
    .toFixed(2);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-slate-400 hover:text-white">
          Dashboard
        </Link>
        <span className="text-slate-600">&gt;</span>
        <span className="text-emerald-500">New Batch Payment</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          New Batch Payment
        </h1>
        <p className="text-slate-400">
          Upload a payment file and send multiple crypto transactions securely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Payment File */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Upload Payment File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onFileSelect={handleFileSelect} />
              {file && (
                <div className="mt-4 text-sm text-slate-400">
                  Selected:{" "}
                  <span className="text-white font-medium">{file.name}</span>
                  {fileFormat && (
                    <span className="ml-2 text-emerald-500">
                      ({fileFormat.toUpperCase()})
                    </span>
                  )}
                </div>
              )}
              {validationError && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {validationError}
                </div>
              )}
            </CardContent>
          </Card>

          {validationResult && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Validation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm text-slate-400">Rows Parsed</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {totalRecipients}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-200">Valid Rows</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">
                      {validPayments}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm text-red-200">Invalid Rows</p>
                    <p className="mt-1 text-2xl font-bold text-red-400">
                      {invalidPayments}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-800">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-950">
                        <tr className="text-slate-300">
                          <th className="px-4 py-3 text-left font-medium">
                            Row
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Address
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Asset
                          </th>
                          <th className="px-4 py-3 text-center font-medium">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.rows.map((row) => (
                          <tr
                            key={`${row.rowNumber}-${row.instruction.address}-${row.instruction.amount}`}
                            className="border-t border-slate-800 bg-slate-950/30 text-slate-200"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">
                              {row.rowNumber}
                            </td>
                            <td
                              className="max-w-[240px] truncate px-4 py-3 font-mono text-xs"
                              title={row.instruction.address}
                            >
                              {row.instruction.address || "Missing address"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs">
                              {row.instruction.amount || "-"}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {row.instruction.asset || "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  row.valid
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-red-500/15 text-red-300"
                                }`}
                                title={
                                  row.valid
                                    ? `Row ${row.rowNumber} is valid`
                                    : `Row ${row.rowNumber}: ${row.error}`
                                }
                              >
                                {row.valid ? "Valid" : "Invalid"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-red-300">
                              {row.error
                                ? `Row ${row.rowNumber}: ${row.error}`
                                : "No issues"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Selection */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Network Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Testnet */}
                <button
                  onClick={() => setSelectedNetwork("testnet")}
                  className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                    selectedNetwork === "testnet"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg">
                      Testnet
                    </h3>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedNetwork === "testnet"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-600"
                      }`}
                    >
                      {selectedNetwork === "testnet" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Practice mode - No real funds
                  </p>
                </button>

                {/* Mainnet */}
                <button
                  onClick={() => setSelectedNetwork("mainnet")}
                  className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                    selectedNetwork === "mainnet"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950/50 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg">
                      Mainnet
                    </h3>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedNetwork === "mainnet"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-600"
                      }`}
                    >
                      {selectedNetwork === "mainnet" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <p className="text-yellow-500 text-sm">Real transactions</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Recipients</span>
                <span className="text-white font-semibold text-lg">
                  {totalRecipients}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Valid Payments</span>
                <span className="text-emerald-500 font-semibold text-lg">
                  {validPayments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Invalid Payments</span>
                <span className="text-red-500 font-semibold text-lg">
                  {invalidPayments}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Estimated Fees</span>
                  <span className="text-white font-medium">
                    {estimatedFees} XLM
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Payout</span>
                  <span className="text-white font-bold text-xl">
                    {totalPayout ?? "0.00"} XLM
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            disabled={!validationResult || invalidPayments > 0}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            <Send className="w-5 h-5 mr-2" />
            {invalidPayments > 0
              ? "Resolve Validation Errors"
              : "Submit Batch Payment"}
          </Button>

          {/* Info Messages */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-slate-400">
                Transactions are irreversible once submitted
              </p>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Info className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-slate-400">
                All payments are validated before processing
              </p>
            </div>
          </div>

          {/* Tips */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <CardTitle className="text-lg text-white">Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-slate-400">
                  Use valid Stellar wallet addresses
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-slate-400">Verify amounts and asset types</p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-slate-400">Test with small amounts first</p>
              </div>
              <button className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center gap-1 mt-2">
                <BookOpen className="w-3 h-3" />
                View Documentation
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
