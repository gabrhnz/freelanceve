// USDC Configuration for Solana
// This file contains constants and helpers for USDC integration on Solana

// USDC SPL Token Address on Solana
export const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

// Solana Network Configuration
export const SOLANA_NETWORKS = {
  mainnet: {
    name: "Solana Mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  devnet: {
    name: "Solana Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    // Devnet USDC for testing
    usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
} as const

// Default network
export const DEFAULT_NETWORK = "mainnet" as const

// USDC has 6 decimals
export const USDC_DECIMALS = 6

// Helper function to format USDC amount for display
export function formatUsdc(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// Helper function to format USDC with symbol
export function formatUsdcWithSymbol(amount: number | string): string {
  return `${formatUsdc(amount)} USDC`
}

// Helper function to parse USDC amount from user input
export function parseUsdcInput(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, "")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Helper function to convert USDC to smallest unit (6 decimals)
export function toUsdcUnits(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** USDC_DECIMALS))
}

// Helper function to convert from smallest unit to USDC
export function fromUsdcUnits(units: bigint | string): number {
  const bigUnits = typeof units === "string" ? BigInt(units) : units
  return Number(bigUnits) / 10 ** USDC_DECIMALS
}

// Validate Solana wallet address format
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded and typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  return base58Regex.test(address)
}

// Shorten Solana address for display
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ""
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// Platform fee percentage (e.g., 5%)
export const PLATFORM_FEE_PERCENTAGE = 5

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return (amount * PLATFORM_FEE_PERCENTAGE) / 100
}

// Calculate seller earnings after platform fee
export function calculateSellerEarnings(amount: number): number {
  return amount - calculatePlatformFee(amount)
}

// Escrow timeout in seconds (e.g., 14 days)
export const ESCROW_TIMEOUT_SECONDS = 14 * 24 * 60 * 60

// Minimum service price in USDC
export const MIN_SERVICE_PRICE = 5

// Maximum service price in USDC
export const MAX_SERVICE_PRICE = 50000

// Solana transaction fee estimate (in SOL) - very low!
export const ESTIMATED_TX_FEE_SOL = 0.000005

// Type for supported networks
export type SupportedNetwork = keyof typeof SOLANA_NETWORKS

// Get USDC mint address for a network
export function getUsdcMint(network: SupportedNetwork = DEFAULT_NETWORK): string {
  return SOLANA_NETWORKS[network].usdcMint
}

// Get RPC URL for a network
export function getRpcUrl(network: SupportedNetwork = DEFAULT_NETWORK): string {
  return SOLANA_NETWORKS[network].rpcUrl
}
