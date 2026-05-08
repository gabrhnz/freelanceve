import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb"
);

export const USDC_MINT_DEVNET = new PublicKey(
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
);

export const CLUSTER = "devnet" as const;

export const RPC_URL = "https://api.devnet.solana.com";

export const CATEGORIES = [
  "Web Development",
  "UI/UX Design",
  "Smart Contracts",
  "Marketing & SEO",
  "Video & Motion",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
