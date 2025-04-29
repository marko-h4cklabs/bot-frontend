// app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSearchParams } from 'next/navigation';

// --- Particles Imports ---
// Import Engine if you directly use Engine type, otherwise remove it
import Particles, { initParticlesEngine } from "@tsparticles/react";
// Remove Engine if not used: import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import type { Container, ISourceOptions } from "@tsparticles/engine"; // Engine removed
import { loadLinksPreset } from "@tsparticles/preset-links";
// ----------------------

// --- Config ---
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const COLLECTION_AUTHORITY = process.env.NEXT_PUBLIC_NFT_COLLECTION_AUTHORITY;
const REQUIRED_NFT_COUNT = 3;
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const FRONTEND_API_SECRET = process.env.NEXT_PUBLIC_FRONTEND_API_SECRET;
const MARKETPLACE_LINK = "https://www.tensor.trade/trade/trenchdemons";

// --- Interfaces ---
interface HeliusAsset {
  id: string;
  grouping?: { group_key: string; group_value: string }[];
}

interface HeliusResponse {
  error?: { message?: string };
  result?: {
    items: HeliusAsset[];
    total: number;
    limit: number;
    page: number;
  };
}

// --- Main Page Component ---
export default function VerificationPage() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            // Pass engine to loadLinksPreset
            await loadLinksPreset(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container): Promise<void> => {
        console.log("Particles container loaded", container);
    };

    const options: ISourceOptions = {
        preset: "links",
        background: {
            color: {
                value: "#000000",
            },
        },
        particles: {
            color: {
                value: "#ffffff",
            },
            links: {
                color: "#4b5563",
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
            },
            move: {
                enable: true,
                speed: 0.5,
            },
            number: {
                density: {
                    enable: true,
                 },
                value: 50,
            },
            opacity: {
                value: 0.5,
            },
            shape: {
                type: "circle",
            },
            size: {
                value: { min: 1, max: 2 },
            },
        },
        detectRetina: true,
    };


    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-neutral-700 bg-black">Loading...</div>}>
            <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-black text-neutral-300 overflow-hidden">
                 {init && (
                    <Particles
                        id="tsparticles"
                        particlesLoaded={particlesLoaded}
                        options={options}
                        className="absolute inset-0 z-0"
                    />
                 )}
                 <div className="relative z-10">
                    <VerificationContent />
                 </div>
            </main>
        </Suspense>
    );
}

// --- Verification Logic Component (No changes needed inside this component for the errors) ---
function VerificationContent() {
    const searchParams = useSearchParams();
    const tgUserId = searchParams.get('tgUserId');

    useConnection();
    const { publicKey, connected } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<
        'idle' | 'checking' | 'success' | 'failure' | 'no_tg_user' | 'backend_notified' | 'backend_error'
    >('idle');
    const [ownedCount, setOwnedCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

     useEffect(() => {
        if (!tgUserId) {
            setVerificationStatus('no_tg_user');
            setErrorMessage("User identification missing. Please access this page via the link from the Telegram bot.");
        } else {
            if (verificationStatus === 'no_tg_user') {
                 setVerificationStatus('idle');
                 setErrorMessage(null);
            }
        }
    }, [tgUserId, verificationStatus]);

    const notifyBackend = useCallback(async () => {
        if (!tgUserId || !BACKEND_API_URL) {
            console.error("Cannot notify backend: Missing Telegram User ID or Backend URL.");
            setErrorMessage("Verification succeeded, but couldn't confirm with the bot (config error). Please contact support.");
            setVerificationStatus('backend_error');
            return;
        }
        setIsLoading(true);
        console.log(`Notifying backend for user ${tgUserId}...`);
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (FRONTEND_API_SECRET) {
                 headers['X-Verification-Secret'] = FRONTEND_API_SECRET;
            }
            const backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/mark-verified`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ userId: parseInt(tgUserId, 10) })
            });
            if (!backendResponse.ok) {
                 const errorData = await backendResponse.json().catch(() => ({}));
                 throw new Error(`Backend Error: ${backendResponse.statusText} ${errorData.error || ''}`);
            }
            const result = await backendResponse.json();
            console.log('Backend notified successfully:', result);
            setVerificationStatus('backend_notified');
            setErrorMessage("Verification complete! Check your Telegram DMs for the group link.");
        } catch (error: unknown) {
            console.error("Error notifying backend:", error);
             let errorMsg = "Verification succeeded, but couldn't confirm with the bot. Please try again later or contact support.";
             if (error instanceof Error) {
                errorMsg = `Verification succeeded, but couldn't confirm with the bot (${error.message}). Please try again later or contact support.`;
             }
             setErrorMessage(errorMsg);
            setVerificationStatus('backend_error');
        } finally {
            setIsLoading(false);
        }
    }, [tgUserId]);

    const verifyNftHoldings = useCallback(async () => {
        if (!publicKey || !HELIUS_API_KEY || !COLLECTION_AUTHORITY || !tgUserId) {
            setErrorMessage("Configuration error, wallet not connected, or Telegram User ID missing.");
            setVerificationStatus('failure');
            return;
        }
        setIsLoading(true);
        setVerificationStatus('checking');
        setErrorMessage(null);
        setOwnedCount(0);
        const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: `verify-${tgUserId}-${Date.now()}`,
                    method: 'getAssetsByOwner',
                    params: { ownerAddress: publicKey.toBase58(), page: 1, limit: 1000, },
                }),
            });
            if (!response.ok) { throw new Error(`Helius API Error: ${response.statusText} (${response.status})`); }
            const data: HeliusResponse = await response.json();
            if (data.error) { throw new Error(`Helius RPC Error: ${data.error?.message || 'Unknown RPC error'}`); }
            if (!data.result || !data.result.items) { throw new Error("Invalid response structure from Helius API"); }
            const ownedNftsFromCollection = data.result.items.filter(asset =>
                asset.grouping?.some(g => g.group_key === 'collection' && g.group_value === COLLECTION_AUTHORITY)
            );
            const count = ownedNftsFromCollection.length;
            setOwnedCount(count);
            if (count >= REQUIRED_NFT_COUNT) {
                setVerificationStatus('success');
                notifyBackend();
            } else {
                setVerificationStatus('failure');
                setErrorMessage(`You need at least ${REQUIRED_NFT_COUNT} NFTs from the specified collection. You currently hold ${count}.`);
            }
        } catch (error: unknown) {
            console.error("Verification failed:", error);
             let errorMsg = "Verification check failed: An unknown error occurred";
             if (error instanceof Error) {
                 errorMsg = `Verification check failed: ${error.message}`;
             } else if (typeof error === 'string') {
                 errorMsg = `Verification check failed: ${error}`;
             }
             setErrorMessage(errorMsg);
            setVerificationStatus('failure');
        } finally {
            if (verificationStatus !== 'success') { setIsLoading(false); }
        }
    }, [publicKey, tgUserId, verificationStatus, notifyBackend]);

     useEffect(() => {
        if (connected && publicKey && verificationStatus === 'idle' && tgUserId) { verifyNftHoldings(); }
        if (!connected || !tgUserId) {
            setVerificationStatus(tgUserId ? 'idle' : 'no_tg_user');
            setErrorMessage(tgUserId ? null : "User identification missing. Please access this page via the link from the Telegram bot.");
            setOwnedCount(0);
        }
      }, [connected, publicKey, verificationStatus, verifyNftHoldings, tgUserId]);


    // --- JSX Rendering ---
    if (verificationStatus === 'no_tg_user') {
         return (
             <div className="w-full max-w-xs p-6 bg-black border border-red-900 rounded-md shadow-red-900/20 shadow-lg text-center">
                 <h1 className="text-md font-medium mb-4 text-red-500">Verification Error</h1>
                 <div className="p-3 bg-neutral-900 border border-red-800/50 text-red-500 rounded text-sm">
                    <p className="font-medium">Cannot Verify</p>
                    {errorMessage && <p className="mt-1">{errorMessage}</p>}
                 </div>
             </div>
        );
    }

    return (
        <div className="w-full max-w-xs p-6 bg-black border border-neutral-900 rounded-md shadow-neutral-900/20 shadow-lg text-center text-white">
            <h1 className="text-md font-medium mb-1">Solana NFT Verification</h1>
             <p className="text-[10px] mb-6 text-neutral-500">For Telegram User ID: {tgUserId || '...'}</p>

            <div className="mb-6 flex justify-center">
                <WalletMultiButton />
            </div>

            {connected && publicKey && (
                <div className="mt-4 space-y-4">
                    <p className="text-[10px] font-mono text-neutral-600 break-all" title={publicKey.toBase58()}>
                      {publicKey.toBase58()}
                    </p>
                    {isLoading && <p className="text-neutral-400 text-sm animate-pulse">Processing...</p>}
                    {!isLoading && (verificationStatus === 'success' || verificationStatus === 'backend_notified' || verificationStatus === 'backend_error') && (
                        <div className="p-3 space-y-1 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded text-sm">
                            <p className="font-semibold text-white">Verification Successful!</p>
                            <p>You hold {ownedCount} required NFTs.</p>
                            {errorMessage && <p className="mt-1 text-xs">{errorMessage}</p>}
                             {verificationStatus === 'backend_error' && <p className="mt-1 text-yellow-500 text-xs font-semibold">Bot confirmation failed.</p>}
                        </div>
                    )}
                    {!isLoading && verificationStatus === 'failure' && (
                        <div className="p-3 space-y-1 bg-neutral-900 border border-red-900 text-red-500 rounded text-sm">
                           <p className="font-semibold text-base">Verification Failed</p>
                            {errorMessage && <p>{errorMessage}</p>}
                            {ownedCount < REQUIRED_NFT_COUNT && (
                                <a href={MARKETPLACE_LINK} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500 hover:underline mt-2 block transition-colors font-medium">
                                   Buy more NFTs
                                </a>
                            )}
                        </div>
                    )}
                </div>
            )}
            {!connected && (
                <p className="mt-4 text-neutral-500 text-sm">Please connect your Solana wallet.</p>
            )}
        </div>
    );
}