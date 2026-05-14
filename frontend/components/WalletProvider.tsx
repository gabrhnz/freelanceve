"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
// @ts-ignore — types export issue in @solana-mobile/wallet-adapter-mobile
import { SolanaMobileWalletAdapter } from "@solana-mobile/wallet-adapter-mobile";
import { RPC_URL } from "@/lib/constants";

import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

const WalletProvider: FC<Props> = ({ children }) => {
  const wallets = useMemo(
    () => [
      // @ts-ignore — constructor shape changed in newer adapter versions
      new SolanaMobileWalletAdapter({
        appIdentity: {
          name: "Wira",
          uri: typeof window !== "undefined" ? window.location.origin : "https://frontend-seven-zeta-70.vercel.app",
          icon: "/icon-192.png",
        },
        cluster: "devnet",
      }),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
