"use client";

/**
 * CSV Validation Errors Display — shows row-level errors with highlighting (#275).
 * Displays invalid rows from a parsed CSV file, allowing users to fix issues before submission.
 */

import { AlertCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedPaymentFile } from "@/lib/stellar/types";

interface CsvValidationErrorsProps {
  validationResult: ParsedPaymentFile;
  maxVisibleErrors?: number;
}

export function CsvValidationErrors({
  validationResult,
  maxVisibleErrors = 5,
}: CsvValidationErrorsProps) {
  const invalidRows = validationResult.rows.filter((row) => !row.valid);

  if (invalidRows.length === 0) {
    return null;
  }

  const visibleErrors = invalidRows.slice(0, maxVisibleErrors);
  const hiddenCount = Math.max(0, invalidRows.length - maxVisibleErrors);

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-400 text-sm font-semibold">
          <XCircle className="size-4" />
          Validation Errors: {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} invalid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-slate-400">
          Fix these errors in your CSV file before submitting:
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {visibleErrors.map((row) => (
            <div
              key={row.rowNumber}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3 flex-shrink-0 text-red-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-red-300">
                    Row {row.rowNumber}
                    {row.isDuplicate ? " (Duplicate)" : ""}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    {row.error}
                  </p>
                  <div className="mt-1.5 text-[0.7rem] text-slate-400 font-mono space-y-0.5">
                    {row.instruction.address && (
                      <p>
                        Address: <span className="text-slate-300">{row.instruction.address.slice(0, 20)}...</span>
                      </p>
                    )}
                    {row.instruction.amount && (
                      <p>
                        Amount: <span className="text-slate-300">{row.instruction.amount}</span>
                      </p>
                    )}
                    {row.instruction.asset && (
                      <p>
                        Asset: <span className="text-slate-300">{row.instruction.asset}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {hiddenCount > 0 && (
          <p className="text-xs text-slate-500 text-center pt-2">
            ... and {hiddenCount} more error{hiddenCount !== 1 ? "s" : ""}
          </p>
        )}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5">
          <AlertCircle className="mt-0.5 size-3.5 flex-shrink-0 text-blue-400" />
          <p className="text-xs text-blue-300">
            Download the sample CSV file to see the expected format, or check the <a href="/docs" className="underline hover:text-blue-200">documentation</a> for detailed requirements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
