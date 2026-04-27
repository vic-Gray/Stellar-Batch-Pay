"use client";

import { useState, useCallback, useEffect } from "react";
import { useFreighter } from "./use-freighter";
import { isMobileDevice, generateSep7TxUri } from "@/lib/stellar/sep7";
import { useToast } from "./use-toast";

export type SigningMethod = "extension" | "sep7";

export interface UseStellarWalletReturn {
    publicKey: string | null;
    isConnecting: boolean;
    method: SigningMethod | null;
    signTx: (xdr: string, network: "testnet" | "mainnet") => Promise<string>;
    connect: () => Promise<void>;
    disconnect: () => void;
    // SEP-7 specific state for the UI to consume
    sep7Uri: string | null;
    isSep7ModalOpen: boolean;
    setSep7ModalOpen: (open: boolean) => void;
}

export function useStellarWallet(): UseStellarWalletReturn {
    const freighter = useFreighter();
    const { toast } = useToast();

    const [method, setMethod] = useState<SigningMethod | null>(null);
    const [sep7Uri, setSep7Uri] = useState<string | null>(null);
    const [isSep7ModalOpen, setIsSep7ModalOpen] = useState(false);

    // Auto-detect recommended method on mount or connection
    useEffect(() => {
        if (freighter.publicKey) {
            setMethod("extension");
        } else if (isMobileDevice()) {
            setMethod("sep7");
        }
    }, [freighter.publicKey]);

    const connect = useCallback(async () => {
        if (isMobileDevice()) {
            setMethod("sep7");
            // For SEP-7, "connecting" usually means the user enters their pubkey 
            // or we just skip to signing. For now, we'll let the user manually 
            // enter their address or use a callback.
            // Most SEP-7 apps just ask for the address if not using a browser wallet.
            toast({
                title: "Mobile Mode",
                description: "SEP-7 deep-linking enabled. You will be prompted to sign in your mobile wallet.",
            });
            return;
        }

        try {
            await freighter.connect();
            setMethod("extension");
        } catch (err) {
            console.error("Freighter connection failed", err);
            setMethod("sep7"); // Fallback
        }
    }, [freighter, toast]);

    const disconnect = useCallback(() => {
        freighter.disconnect();
        setMethod(null);
        setSep7Uri(null);
    }, [freighter]);

    const signTx = useCallback(
        async (xdr: string, network: "testnet" | "mainnet"): Promise<string> => {
            // If we're on mobile or don't have Freighter, use SEP-7
            if (isMobileDevice() || method === "sep7" || !freighter.isInstalled) {
                const networkPassphrase =
                    network === "testnet"
                        ? "Test SDF Network ; September 2015"
                        : "Public Global Stellar Network ; September 2015";

                const uri = generateSep7TxUri({
                    xdr,
                    networkPassphrase,
                    msg: "Sign BatchPay Transaction",
                });

                setSep7Uri(uri);
                setIsSep7ModalOpen(true);

                // Return a promise that never resolves here because the user is 
                // redirecting away or using a QR code. The app will need to 
                // poll for the transaction completion separately.
                // #256: Mobile flow is asymmetrical.
                return new Promise(() => { });
            }

            // Default to Freighter if on desktop
            return await freighter.signTx(xdr, network);
        },
        [freighter, method]
    );

    return {
        publicKey: freighter.publicKey,
        isConnecting: freighter.isConnecting,
        method,
        connect,
        disconnect,
        signTx,
        sep7Uri,
        isSep7ModalOpen,
        setSep7ModalOpen: setIsSep7ModalOpen,
    };
}
