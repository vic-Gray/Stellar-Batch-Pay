"use client";

import { useWallet } from "@/contexts/WalletContext";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export function NetworkWarning() {
  const { networkMismatch, network, expectedNetwork } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  if (!networkMismatch || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-300">Network Mismatch</p>
          <p className="mt-1 text-amber-200/80">
            You are connected to <strong>{network || "unknown"}</strong>, but this app expects{" "}
            <strong>{expectedNetwork}</strong>. Please switch your wallet network to continue.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-amber-300 hover:text-amber-200 transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
