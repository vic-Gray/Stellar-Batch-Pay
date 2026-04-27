/**
 * lib/stellar/sep7.ts - SEP-7 Delegate Signing Support (#256)
 * 
 * This module provides utilities to generate SEP-7 (Stellar Ecosystem Proposal 7) 
 * request URIs, allowing users on mobile devices to sign transactions using 
 * compatible wallets (e.g., LUNAR, Vibrant, Albedo).
 */

/**
 * Generate a SEP-7 tx (transaction) URI.
 * Format: web+stellar:tx?xdr=<base64-xdr>&callback=<url>&pubkey=<key>&msg=<msg>&network_passphrase=<passphrase>
 */
export function generateSep7TxUri(params: {
    xdr: string;
    callback?: string;
    pubkey?: string;
    msg?: string;
    networkPassphrase?: string;
    originDomain?: string;
}): string {
    const { xdr, callback, pubkey, msg, networkPassphrase, originDomain } = params;

    let uri = `web+stellar:tx?xdr=${encodeURIComponent(xdr)}`;

    if (callback) uri += `&callback=${encodeURIComponent(callback)}`;
    if (pubkey) uri += `&pubkey=${encodeURIComponent(pubkey)}`;
    if (msg) uri += `&msg=${encodeURIComponent(msg)}`;
    if (networkPassphrase) uri += `&network_passphrase=${encodeURIComponent(networkPassphrase)}`;
    if (originDomain) uri += `&origin_domain=${encodeURIComponent(originDomain)}`;

    return uri;
}

/**
 * Check if the current environment is a mobile device.
 * Used to decide whether to show a deep-link (SEP-7) or use traditional browser extensions.
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent
    );
}

/**
 * Get the appropriate signing method based on device and available extensions.
 * Returns 'sep7' if mobile or 'extension' if Freighter is available.
 */
export async function getRecommendedSigningMethod(): Promise<'sep7' | 'extension'> {
    if (isMobileDevice()) return 'sep7';

    // Check for Freighter (window.staller is usually set by Freighter)
    // Dynamic import to avoid SSR issues
    if (typeof window !== 'undefined' && (window as any).staller) {
        return 'extension';
    }

    return 'sep7'; // Fallback to SEP-7 (QR code or deep-link) if no extension found
}
