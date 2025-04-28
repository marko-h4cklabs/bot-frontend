// app/layout.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme";
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// --- Import specific MWA-compatible wallet adapters ---
// Select the wallets you want to support. Phantom and Solflare are common.
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    // You can add others here if needed, e.g.:
    // CoinbaseWalletAdapter,
    // TrustWalletAdapter,
    // LedgerWalletAdapter,
    // TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
// ------------------------------------------------------

import '@solana/wallet-adapter-react-ui/styles.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // --- Instantiate the adapters you want to support ---
  const wallets = useMemo(
    () => [
        // These adapters support MWA for connecting to their respective mobile apps
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        // Add instances of other imported adapters if desired
        // e.g., new CoinbaseWalletAdapter(), new TrustWalletAdapter(), etc.
    ],
    // You can keep network dependency if adapters might behave differently based on network,
    // though often it's not strictly necessary for just instantiation.
    [network]
  );
  // ------------------------------------------------------

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConnectionProvider endpoint={endpoint}>
          {/* Pass the array of instantiated adapters to the WalletProvider */}
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}