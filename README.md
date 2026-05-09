# Wira — Decentralized Freelance Marketplace on Solana

> **Hire talent. Get paid in USDC. No banks. No borders. Trustless escrow.**

Wira is a freelance marketplace on **Solana** where every payment flows through an **on-chain USDC escrow**. Freelancers publish services, clients hire with one click, and funds are locked in a PDA-controlled token account until the work is approved.

Built for the **Latin American remote worker** who needs fast, borderless, censorship-resistant payments.

---

## Live Demo

| | |
|--|--|
| **App** | [frontend-mauve-kappa-18.vercel.app](https://frontend-mauve-kappa-18.vercel.app) |
| **Program** | [`6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb`](https://explorer.solana.com/address/6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb?cluster=devnet) |
| **Network** | Solana Devnet |
| **Security Audit** | [SECURITY.md](./SECURITY.md) — 10 vulnerabilities found & fixed |

---

## Problem → Solution

Traditional freelance platforms charge **20%+ fees**, hold funds for days, and exclude unbanked workers. Crypto payments exist but lack buyer protection.

Wira fixes this:

- **0% platform fees** — only Solana tx fees (~$0.0005)
- **Instant USDC settlements** — no 14-day holds
- **Trustless escrow** — funds locked on-chain, released only when client approves
- **Automatic refunds** — deadline passes → client reclaims on-chain
- **Wallet-first auth** — connect wallet and go; email is optional

---

## Escrow Flow

```
Client → place_order() → USDC locked in PDA escrow
                ↓
Freelancer → deliver_order() → status: Delivered
                ↓
Client → approve_order() → USDC released to freelancer
         OR
Client → refund_order() → USDC returned (after deadline)
```

Every transaction verifiable on [Solana Explorer](https://explorer.solana.com/?cluster=devnet).

---

## On-Chain Program (Anchor / Rust)

**8 instructions, 5 PDA types, 14 custom error codes.**

| Instruction | Description |
|---|---|
| `register_freelancer` | PDA profile with name, bio, skills, stats |
| `update_profile` | Update freelancer info |
| `create_service` | Service listing with USDC price + delivery deadline |
| `toggle_service` | Pause/resume (`has_one = freelancer` constraint) |
| `place_order` | USDC → escrow PDA via SPL CPI (self-deal blocked) |
| `deliver_order` | Freelancer marks delivered (`has_one = freelancer`) |
| `approve_order` | Client releases escrow → freelancer (`has_one = client`) |
| `refund_order` | Client refund after deadline (`has_one = client` + Clock check) |

### PDA Architecture

| Account | Seeds |
|---|---|
| `FreelancerProfile` | `["profile", owner]` |
| `ServiceListing` | `["service", owner, service_count]` |
| `Order` | `["order", service, orders_count]` |
| `EscrowAuthority` | `["escrow", order]` |
| `EscrowTokenAccount` | `["escrow_token", order]` |

### Security Hardening

Full audit in [`SECURITY.md`](./SECURITY.md) — highlights:

- `has_one` constraints on all sensitive instructions
- Escrow bump pinned to stored value (no PDA confusion)
- Self-dealing prevention (`client ≠ freelancer`)
- Input length validation on all string fields
- Safe arithmetic (`checked_add` with typed errors)
- Token mint verification on escrow operations

---

## Frontend Features

- **Marketplace** — Browse, search, filter by category + AI smart search (OpenRouter)
- **Wallet-first onboarding** — Connect wallet → auto-register flow; email optional
- **USDC Escrow Payment** — One-click hire → wallet signs → USDC locked on-chain
- **Transaction History** — In-app order history with Solana Explorer deep links
- **Order Lifecycle** — Accept → deliver → approve/refund with real-time status
- **Real-time Chat** — Per-order messaging + direct messages + file attachments
- **AI Service Enhancer** — One-click AI copywriting for titles & descriptions
- **Invoice Generator** — Auto-generated invoices with tx signatures
- **Email Notifications** — OTP auth + order notifications via Resend
- **Public Profiles** — Shareable pages with portfolio, reviews, social links
- **Multi-language** — ES/EN static translations (instant switch)
- **Neobrutalist UI** — Custom design system, mobile-first

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Smart Contract** | Rust + Anchor 0.29 |
| **Blockchain** | Solana Devnet |
| **Token** | USDC (SPL Token) |
| **Frontend** | Next.js 14 + TypeScript + Tailwind CSS |
| **Wallet** | `@solana/wallet-adapter-react` (Phantom, Solflare, Backpack) |
| **Database** | Supabase (Postgres + RLS + Realtime) |
| **Auth** | Email OTP (Resend) + Wallet signature |
| **File Security** | VirusTotal malware scanning |
| **AI** | OpenRouter (Llama 3.1 8B) — smart search + enhancer |
| **Hosting** | Vercel |

---

## Solana SDK Usage

- **5 PDA types** with distinct seed schemas
- **`CpiContext::new_with_signer`** — PDA-signed SPL token transfers
- **`token::transfer` CPI** — Cross-program invocation for USDC
- **`Clock` sysvar** — Deadline enforcement for refunds
- **Anchor constraints** — `init`, `mut`, `has_one`, `seeds`, `bump`
- **14 custom error codes** — typed errors for every failure mode
- **State machine** — InProgress → Delivered → Completed/Refunded
- **Mobile Wallet Adapter** — `@solana-mobile/wallet-adapter-mobile` for Saga/Seeker support

---

## Solana Mobile Integration

Wira supports the **Mobile Wallet Adapter (MWA)** protocol via `@solana-mobile/wallet-adapter-mobile`:

- Android mobile users connect to on-device wallets (Phantom, Solflare) directly from Chrome
- No browser extension required — native wallet app handles signing
- Compatible with **Saga** and **Seeker** devices
- App identity registered for secure wallet handshake
- PWA-ready architecture for future **dApp Store** submission via TWA

---

## Quick Start

```bash
# Clone
git clone https://github.com/your-username/freelance-ve.git
cd freelance-ve

# Deploy program
solana config set --url devnet
solana airdrop 2
anchor build && anchor deploy

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Test Flow

1. Install [Phantom](https://phantom.app/) → switch to Devnet
2. `solana airdrop 2 <phantom-address>`
3. Connect wallet → register → publish service (signs on-chain)
4. Second wallet → hire service → USDC locked in escrow
5. Deliver → approve → USDC released to freelancer

---

## Comparison

| | Wira | Fiverr/Upwork | Other Crypto |
|---|---|---|---|
| Fee | **0%** | 20% | 0-5% |
| Speed | **~2s** | 14 days | Varies |
| Escrow | **On-chain PDA** | Centralized | Usually none |
| Refund | **Automatic** | Manual | N/A |
| Bank required | **No** | Yes | Sometimes |
| Identity required | **No** | Yes | Sometimes |

---

## License

MIT
