"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useStellarWallet, SigningMethod } from "@/hooks/use-stellar-wallet";
import { Sep7Modal } from "@/components/dashboard/Sep7Modal";

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
  method: SigningMethod | null;
  sep7Uri: string | null;
  isSep7ModalOpen: boolean;
  setSep7ModalOpen: (open: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export interface WalletProviderProps {
  children: React.ReactNode;
  expectedNetwork?: SorobanNetwork;
}

export function WalletProvider({ children, expectedNetwork = "testnet" }: WalletProviderProps) {
  const wallet = useStellarWallet();
  const [selectedNetwork, setSelectedNetwork] = useState<SorobanNetwork>(expectedNetwork);
  const [detectedNetwork, setDetectedNetwork] = useState<SorobanNetwork | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);

  // Restore network from localStorage on mount
  useEffect(() => {
    const storedNetwork = (localStorage.getItem("wallet_network") as SorobanNetwork) || expectedNetwork;
    setSelectedNetwork(storedNetwork);
  }, [expectedNetwork]);

  // Detect network 
  useEffect(() => {
    if (wallet.publicKey) {
      // Default to stored network
      const stored = (localStorage.getItem("wallet_network") as SorobanNetwork) || expectedNetwork;
      setDetectedNetwork(stored);
      setNetworkMismatch(stored !== selectedNetwork);
      localStorage.setItem("wallet_public_key", wallet.publicKey);
    } else {
      setDetectedNetwork(null);
      localStorage.removeItem("wallet_public_key");
    }
  }, [wallet.publicKey, selectedNetwork, expectedNetwork]);

  const handleConnect = useCallback(async () => {
    try {
      await wallet.connect();
      localStorage.setItem("wallet_network", selectedNetwork);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [wallet, selectedNetwork]);

  const handleDisconnect = useCallback(() => {
    wallet.disconnect();
    localStorage.removeItem("wallet_public_key");
    localStorage.removeItem("wallet_network");
  }, [wallet]);

  const handleSelectNetwork = useCallback((network: SorobanNetwork) => {
    setSelectedNetwork(network);
    localStorage.setItem("wallet_network", network);
    setNetworkMismatch(network !== detectedNetwork);
  }, [detectedNetwork]);

  const handleSignTx = useCallback(
    async (xdr: string, network: SorobanNetwork): Promise<string> => {
      return wallet.signTx(xdr, network === "mainnet" ? "mainnet" : "testnet");
    },
    [wallet]
  );

  const value: WalletContextType = {
    publicKey: wallet.publicKey,
    isConnecting: wallet.isConnecting,
    isInstalled: true, // SEP-7 is always "installed"
    error: null,
    network: detectedNetwork,
    networkMismatch,
    expectedNetwork: selectedNetwork,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signTx: handleSignTx,
    selectNetwork: handleSelectNetwork,
    method: wallet.method,
    sep7Uri: wallet.sep7Uri,
    isSep7ModalOpen: wallet.isSep7ModalOpen,
    setSep7ModalOpen: wallet.setSep7ModalOpen,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
      <Sep7Modal
        isOpen={wallet.isSep7ModalOpen}
        onOpenChange={wallet.setSep7ModalOpen}
        uri={wallet.sep7Uri}
      />
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
