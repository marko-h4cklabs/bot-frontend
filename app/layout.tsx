// app/layout.tsx
"use client"; // <-- Add this line

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme"; // You can keep theme if desired

// Solana Wallet Adapter imports
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import Wallet Adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// --- Font setup remains the same ---
const geistSans = Geist({ // Use Geist directly if available
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({ // Use Geist_Mono directly if available
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
// -----------------------------------

// Metadata might not work directly in "use client" components in older Next versions,
// but let's keep it for now. You might need to move it to the page component if needed.
// export const metadata: Metadata = {
//   title: "Solana NFT Verification",
//   description: "Verify NFT holdings",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Set network to mainnet-beta
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Define wallets to support (add others like Solflare if needed)
  const wallets = useMemo(
    () => [], // Auto-detect Phantom, Solflare etc. if installed. Or list explicitly: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
    [network]
  );

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Wrap with Solana Providers */}
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {/* You can keep ThemeProvider or remove it */}
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