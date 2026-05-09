import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb"
);

export const USDC_MINT_DEVNET = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
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

export const SKILL_SUGGESTIONS = [
  // Solana core
  "Rust", "Anchor", "Solana Programs", "SPL Tokens", "PDAs", "CPIs",
  "Token Extensions", "Metaplex", "Compressed NFTs", "Bubblegum",
  // Frontend / Web3
  "React", "Next.js", "TypeScript", "Tailwind CSS", "Wallet Adapter",
  "@solana/web3.js", "Solana Mobile (dApp Store)", "React Native",
  // DeFi / Protocols
  "DeFi", "AMM", "Lending Protocols", "Jupiter Integration", "Raydium",
  "Orca Whirlpools", "Marinade", "Pyth Oracle", "Switchboard",
  // Infra / Tooling
  "RPC Nodes", "Helius", "Triton", "Solana Validator", "Geyser Plugins",
  "Account Compression", "ZK Compression", "Clockwork", "Jito MEV",
  // NFT / Gaming
  "NFT Collections", "Tensor", "Magic Eden", "Unity + Solana", "Unreal + Solana",
  // AI & Data
  "AI Agents", "Machine Learning", "Data Pipelines", "Indexers", "TheGraph",
  // Creative / Marketing
  "UI/UX Design", "Figma", "Brand Design", "Copywriting", "SEO",
  "Social Media", "Community Management", "Video Editing", "Motion Graphics",
  // Business
  "Smart Contract Auditing", "Tokenomics", "Whitepaper Writing", "DAO Governance",
] as const;
