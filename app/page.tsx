// app/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from '@/components/ui/button'; // Assuming you keep your Button component

// Configuration (Ideally read from environment variables)
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const COLLECTION_AUTHORITY = process.env.NEXT_PUBLIC_NFT_COLLECTION_AUTHORITY;
const REQUIRED_NFT_COUNT = 3;

// Basic structure for API response (adjust based on actual Helius response)
interface HeliusAsset {
  id: string;
  grouping: { group_key: string; group_value: string }[];
  // Add other fields if needed
}

interface HeliusResponse {
  result: {
    items: HeliusAsset[];
    total: number;
    limit: number;
    page: number;
  };
}


export default function VerificationPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'checking' | 'success' | 'failure'
  >('idle');
  const [ownedCount, setOwnedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyNftHoldings = useCallback(async () => {
    if (!publicKey || !HELIUS_API_KEY || !COLLECTION_AUTHORITY) {
      setErrorMessage("Configuration error or wallet not connected.");
      setVerificationStatus('failure');
      return;
    }

    setIsLoading(true);
    setVerificationStatus('checking');
    setErrorMessage(null);
    setOwnedCount(0);

    const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`; // Use appropriate Helius RPC URL

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: publicKey.toBase58(),
            page: 1, // Start page
            limit: 1000, // Adjust limit if needed
            // We filter client-side, Helius filtering can be complex/costly
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Helius API Error: ${response.statusText}`);
      }

      const data: HeliusResponse = await response.json(); // Add better typing based on Helius response

      if (!data.result || !data.result.items) {
         throw new Error("Invalid response structure from Helius API");
      }

      // Filter assets client-side
      const ownedNftsFromCollection = data.result.items.filter(asset =>
        asset.grouping?.some(g => g.group_key === 'collection' && g.group_value === COLLECTION_AUTHORITY)
      );

      const count = ownedNftsFromCollection.length;
      setOwnedCount(count);

      if (count >= REQUIRED_NFT_COUNT) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('failure');
        setErrorMessage(`You need at least ${REQUIRED_NFT_COUNT} NFTs from the specified collection. You currently hold ${count}.`);
      }

    } catch (error: any) {
      console.error("Verification failed:", error);
      setErrorMessage(`Verification failed: ${error.message}`);
      setVerificationStatus('failure');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Automatically trigger verification when wallet connects
  useEffect(() => {
    if (connected && publicKey && verificationStatus === 'idle') {
      verifyNftHoldings();
    }
    // Reset status if wallet disconnects
    if (!connected) {
        setVerificationStatus('idle');
        setErrorMessage(null);
        setOwnedCount(0);
    }
  }, [connected, publicKey, verificationStatus, verifyNftHoldings]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">Solana NFT Verification</h1>

        {/* Wallet Connect Button */}
        <div className="mb-6">
          <WalletMultiButton />
        </div>

        {connected && publicKey && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connected: {publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().substring(publicKey.toBase58().length - 6)}
            </p>

            {/* Verification Status Display */}
            {isLoading && <p>Checking NFT holdings...</p>}

            {!isLoading && verificationStatus === 'success' && (
              <div className="p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                <p className="font-semibold">Verification Successful!</p>
                <p>You hold {ownedCount} NFTs from the collection.</p>
                {/* Add link/button to join/proceed */}
              </div>
            )}

            {!isLoading && verificationStatus === 'failure' && (
              <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                 <p className="font-semibold">Verification Failed</p>
                {errorMessage && <p>{errorMessage}</p>}
                {/* Add link to Magic Eden or marketplace */}
                {ownedCount < REQUIRED_NFT_COUNT && (
                    <a href="YOUR_MAGIC_EDEN_LINK_HERE" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2 block">
                       Buy more NFTs
                    </a>
                )}
              </div>
            )}

             {/* Optionally, add a manual verify button if auto-verify isn't desired */}
             {/* <Button
                onClick={verifyNftHoldings}
                disabled={isLoading || !connected}
                color={isLoading ? "secondary" : "default"}
             >
                {isLoading ? 'Checking...' : 'Verify Holdings'}
             </Button> */}
          </div>
        )}

        {!connected && (
            <p className="mt-4 text-gray-500 dark:text-gray-400">Please connect your Solana wallet to verify.</p>
        )}
      </div>
    </main>
  );
}