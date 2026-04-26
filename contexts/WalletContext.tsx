"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useFreighter } from "@/hooks/use-freighter";

export type SorobanNetwork = "mainnet" | "testnet" | "futurenet";

interface WalletContextType {
  publicKey: string | null;
  isConnecting: boolean;
  isInstalled: boolean | null;
  error: string | null;
  network: SorobanNetwork | null;
  networkMismatch: boolean;
  expectedNetwork: SorobanNetwork;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (xdr: string, network: SorobanNetwork) => Promise<string>;
  selectNetwork: (network: SorobanNetwork) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export interface WalletProviderProps {
  children: React.ReactNode;
  expectedNetwork?: SorobanNetwork;
}

export function WalletProvider({ children, expectedNetwork = "testnet" }: WalletProviderProps) {
  const freighter = useFreighter();
  const [savedPublicKey, setSavedPublicKey] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<SorobanNetwork>(expectedNetwork);
  const [detectedNetwork, setDetectedNetwork] = useState<SorobanNetwork | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);

  // Restore wallet from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("wallet_public_key");
    if (stored) {
      setSavedPublicKey(stored);
    }
    const storedNetwork = (localStorage.getItem("wallet_network") as SorobanNetwork) || expectedNetwork;
    setSelectedNetwork(storedNetwork);
  }, [expectedNetwork]);

  // Detect network from Freighter (simplified; Freighter doesn't expose network directly)
  // In production, you'd fetch this from Soroban RPC or a config service
  useEffect(() => {
    if (freighter.publicKey) {
      // Default to stored network; in future could detect from Freighter settings
      const stored = (localStorage.getItem("wallet_network") as SorobanNetwork) || expectedNetwork;
      setDetectedNetwork(stored);
      setNetworkMismatch(stored !== selectedNetwork);
      localStorage.setItem("wallet_public_key", freighter.publicKey);
      setSavedPublicKey(freighter.publicKey);
    } else {
      setSavedPublicKey(null);
      setDetectedNetwork(null);
      localStorage.removeItem("wallet_public_key");
    }
  }, [freighter.publicKey, selectedNetwork, expectedNetwork]);

  const handleConnect = useCallback(async () => {
    try {
      await freighter.connect();
      localStorage.setItem("wallet_network", selectedNetwork);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [freighter, selectedNetwork]);

  const handleDisconnect = useCallback(() => {
    freighter.disconnect();
    localStorage.removeItem("wallet_public_key");
    localStorage.removeItem("wallet_network");
    setSavedPublicKey(null);
  }, [freighter]);

  const handleSelectNetwork = useCallback((network: SorobanNetwork) => {
    setSelectedNetwork(network);
    localStorage.setItem("wallet_network", network);
    setNetworkMismatch(network !== detectedNetwork);
  }, [detectedNetwork]);

  const handleSignTx = useCallback(
    async (xdr: string, network: SorobanNetwork): Promise<string> => {
      return freighter.signTx(xdr, network === "mainnet" ? "mainnet" : "testnet");
    },
    [freighter]
  );

  const value: WalletContextType = {
    publicKey: freighter.publicKey,
    isConnecting: freighter.isConnecting,
    isInstalled: freighter.isInstalled,
    error: freighter.error,
    network: detectedNetwork,
    networkMismatch,
    expectedNetwork: selectedNetwork,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signTx: handleSignTx,
    selectNetwork: handleSelectNetwork,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
