"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Sep7ModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    uri: string | null;
}

export function Sep7Modal({ isOpen, onOpenChange, uri }: Sep7ModalProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    if (!uri) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(uri);
        setCopied(true);
        toast({
            title: "Copied!",
            description: "SEP-7 URI copied to clipboard.",
        });
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uri)}&color=00D98B&bgcolor=121827`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#121827] border-[#1F2937] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Sign Transaction</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Scan the QR code with a Stellar wallet (Vibrant, LUNAR) or click the button below to open your mobile wallet.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <div className="bg-white p-3 rounded-xl shadow-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrUrl}
                            alt="SEP-7 QR Code"
                            className="w-64 h-64"
                        />
                    </div>

                    <div className="w-full flex flex-col gap-3">
                        <Button
                            className="w-full h-12 bg-[#00D98B] hover:bg-[#00D98B]/90 text-white font-bold"
                            onClick={() => window.open(uri, "_blank")}
                        >
                            <ExternalLink className="mr-2 h-5 w-5" />
                            Open in Mobile Wallet
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full border-[#1F2937] hover:bg-[#1F2937] text-gray-300"
                            onClick={handleCopy}
                        >
                            {copied ? <Check className="mr-2 h-4 w-4 text-[#00D98B]" /> : <Copy className="mr-2 h-4 w-4" />}
                            {copied ? "Copied URI" : "Copy SEP-7 URI"}
                        </Button>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center text-xs text-gray-500 italic">
                    Transactions expire in 5 minutes after generation.
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
