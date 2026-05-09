# Wira — Decentralized Freelance Marketplace on Solana

> **Hire talent. Get paid in USDC. No banks. No borders. Trustless escrow.**

Wira is a production-grade freelance marketplace built on **Solana** where every payment flows through an **on-chain USDC escrow**. Freelancers publish services, clients hire with one click, and funds are locked in a PDA-controlled token account until the work is approved — eliminating chargebacks, middlemen, and trust issues.

Built for the **Latin American remote worker** who needs fast, borderless, censorship-resistant payments.

---

## Live Demo & Contract

| | |
|--|--|
| **Live App** | [https://frontend-mauve-kappa-18.vercel.app](https://frontend-mauve-kappa-18.vercel.app) |
| **Program ID** | [`6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb`](https://explorer.solana.com/address/6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb?cluster=devnet) |
| **Network** | Solana Devnet |
| **USDC Mint** | [`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`](https://explorer.solana.com/address/4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU?cluster=devnet) |

---

## Problem

Traditional freelance platforms (Fiverr, Upwork) charge **20%+ fees**, hold funds for days, exclude unbanked workers, and require identity verification that blocks millions of talented people in developing countries. Crypto payments exist but lack escrow — so there's no buyer protection.

## Solution

Wira combines the UX of modern freelance platforms with Solana's speed and USDC stability:

- **Zero platform fees** on payments (only Solana tx fees: ~$0.0005)
- **Instant USDC settlements** — no 14-day holds, no PayPal, no bank account needed
- **Trustless escrow** — funds locked on-chain, released only when client approves
- **Automatic refunds** — if freelancer misses the deadline, client reclaims funds on-chain
- **Dual auth** — Email OTP + Wallet for accessibility (no crypto-native requirement)

---

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  FREELANCER  │     │   SOLANA CHAIN    │     │     CLIENT      │
│              │     │                  │     │                 │
│ 1. Register  │────▶│ register_        │     │                 │
│    Profile   │     │ freelancer (PDA) │     │                 │
│              │     │                  │     │                 │
│ 2. Publish   │────▶│ create_service   │     │                 │
│    Service   │     │ (PDA + sign)     │     │                 │
│              │     │                  │     │                 │
│              │     │                  │◀────│ 3. Hire Service │
│              │     │ place_order      │     │    (USDC →      │
│              │     │ (USDC → Escrow)  │     │     Escrow PDA) │
│              │     │                  │     │                 │
│ 4. Deliver   │────▶│ deliver_order    │     │                 │
│    Work      │     │ (status change)  │     │                 │
│              │     │                  │     │                 │
│              │     │                  │◀────│ 5. Approve      │
│  ┌─────────┐ │     │ approve_order    │     │ (Escrow → USDC  │
│  │ USDC 💰 │◀│─────│ (Escrow → Free.) │     │  to Freelancer) │
│  └─────────┘ │     │                  │     │                 │
│              │     │  OR              │     │                 │
│              │     │                  │◀────│ 6. Refund       │
│              │     │ refund_order     │     │ (after deadline)│
│              │     │ (Escrow → Client)│     │                 │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

Every transaction is verifiable on [Solana Explorer](https://explorer.solana.com/?cluster=devnet).

---

## Features

### On-Chain (Anchor Program — Rust)

| Instruction | What it does |
|-------------|-------------|
| `register_freelancer` | Creates a PDA profile with name, bio, skills, stats |
| `update_profile` | Updates freelancer info (name, bio, skills) |
| `create_service` | Publishes a service with USDC price + delivery days |
| `toggle_service` | Pause/resume a service listing |
| `place_order` | Client pays → USDC transferred to escrow PDA via SPL CPI |
| `deliver_order` | Freelancer marks work as delivered (status → Delivered) |
| `approve_order` | Client approves → USDC released from escrow to freelancer via PDA-signed CPI |
| `refund_order` | Auto-refund after deadline passes (escrow → client) |

### PDA Architecture

| Account | Seeds | Purpose |
|---------|-------|---------|
| `FreelancerProfile` | `["profile", owner]` | On-chain reputation: jobs, earnings, rating |
| `ServiceListing` | `["service", owner, index]` | Service with price, category, order counter |
| `Order` | `["order", service, order_index]` | Order state machine + escrow bump |
| `EscrowAuthority` | `["escrow", order]` | PDA signer for token transfers |
| `EscrowTokenAccount` | `["escrow_token", order]` | SPL token account holding USDC |

### AI-Powered Features (OpenRouter + Llama 3.1)

| Feature | What it does |
|---------|-------------|
| **Smart Search** | Natural language queries ranked by AI semantic relevance |
| **Service Enhancer** | One-click AI copywriting for service titles & descriptions |
| **Live Translation** | Auto-translates service listings when user switches language |

All AI features use `meta-llama/llama-3.1-8b-instruct` via OpenRouter — fast, cheap, and reliable.

### Off-Chain (Next.js Frontend)

- **Marketplace** — Browse, search, filter services by category + AI-powered smart search
- **Service Publishing** — Create service → sign on-chain (register_freelancer + create_service)
- **USDC Escrow Payment** — One-click hire → wallet signs `place_order` → USDC locked
- **Order Management** — Full lifecycle: accept → deliver → approve/refund
- **Real-time Chat** — Per-order messaging with typing indicators, read receipts, file attachments
- **Direct Messages** — Pre-order chat between any two users
- **File Sharing** — Upload images/PDFs with VirusTotal malware scanning
- **Invoice Generator** — Auto-generated invoices with tx hashes for each completed order
- **Email Notifications** — OTP auth + order/message notifications via Resend
- **Dual Auth** — Email OTP (Supabase) + Wallet adapter (Phantom, Solflare, Backpack)
- **Public Profiles** — Shareable profile pages with portfolio, social links, reviews
- **Admin Panel** — User management, content moderation
- **Multi-language** — Spanish/English support
- **Responsive** — Mobile-first design

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Smart Contract** | Rust + Anchor 0.29 | Type-safe PDAs, auto-serialization, CPI helpers |
| **Blockchain** | Solana Devnet | 400ms finality, ~$0.0005 tx cost, SPL Token standard |
| **Token** | USDC (SPL Token) | Stable value, no volatility for freelancers |
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR, file-based routing, React Server Components |
| **Styling** | Tailwind CSS | Custom neobrutalist design system |
| **Wallet** | `@solana/wallet-adapter-react` | Phantom, Solflare, Backpack, Torus support |
| **Database** | Supabase (Postgres) | Real-time subscriptions, Row Level Security, Storage |
| **Auth** | Email OTP + Wallet signature | Accessible to non-crypto users |
| **Email** | Resend API | Transactional emails (OTP, notifications) |
| **File Security** | VirusTotal API | Malware scanning before file storage |
| **AI/LLM** | OpenRouter (Llama 3.1 8B) | Smart search, copywriting, live translation |
| **Hosting** | Vercel | Edge functions, instant deploys |

---

## Solana SDK Usage

The program demonstrates advanced Solana patterns:

- **`ProgramDerivedAddress`** — 5 distinct PDA types with custom seed schemas
- **`CpiContext::new_with_signer`** — PDA-signed SPL token transfers for escrow release/refund
- **`token::transfer` CPI** — Cross-program invocation to Token Program for USDC movements
- **`Clock` sysvar** — Deadline enforcement for automatic refund eligibility
- **`Account` constraints** — Anchor's `init`, `mut`, `has_one`, `seeds`, `bump` for safety
- **Custom error codes** — 10 typed errors (Unauthorized, PriceTooLow, DeadlineNotReached, etc.)
- **State machine** — Order status transitions enforced on-chain (InProgress → Delivered → Completed/Refunded)

---

## Project Structure

```
wira/
├── programs/freelance-ve/
│   └── src/lib.rs                     # Anchor program (475 lines, 8 instructions)
├── tests/                             # Anchor integration tests
├── Anchor.toml                        # Program config + cluster
├── Cargo.toml
│
└── frontend/                          # Next.js 14 App
    ├── app/
    │   ├── page.tsx                   # Landing page (animated hero, features)
    │   ├── register/                  # Multi-step registration (OTP + wallet)
    │   ├── dashboard/                 # Freelancer/employer dashboard
    │   ├── marketplace/               # Service browsing + detail pages
    │   ├── services/new/              # Publish service (on-chain signing)
    │   ├── services/[id]/edit/        # Edit service
    │   ├── orders/                    # Order list + detail (chat, lifecycle)
    │   ├── inbox/                     # Unified inbox (order chats + DMs)
    │   ├── chat/[userId]/             # Direct messaging
    │   ├── profile/edit/              # Profile editor (avatar, socials, portfolio)
    │   ├── profile/[wallet]/          # Public profile page
    │   ├── u/[username]/              # Shareable username page
    │   ├── admin/                     # Admin panel
    │   └── api/                       # Auth, notifications, file upload
    │       ├── auth/send-otp/         # Email OTP sender
    │       ├── auth/verify-otp/       # OTP verification + JWT
    │       ├── notify/                # Email notifications
    │       └── upload/                # VirusTotal scan + Supabase Storage
    ├── components/                    # 15+ React components
    ├── contexts/                      # Session + language providers
    ├── lib/
    │   ├── program.ts                 # All Solana interactions (PDAs, CPI calls)
    │   ├── supabase.ts                # Database queries + real-time subscriptions
    │   ├── auth.ts                    # OTP + JWT authentication
    │   ├── constants.ts               # Program ID, USDC mint, RPC URL
    │   └── utils.ts                   # Helpers
    └── idl/freelance_ve.json          # Program IDL (auto-generated by Anchor)
```

---

## Local Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust | latest | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Solana CLI | 1.17+ | `sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"` |
| Anchor CLI | 0.29+ | `cargo install --git https://github.com/coral-xyz/anchor avm && avm install 0.29.0` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Phantom | latest | [phantom.app](https://phantom.app/) |

### 1. Clone & setup

```bash
git clone https://github.com/your-username/freelance-ve.git
cd freelance-ve
```

### 2. Deploy Solana program

```bash
solana config set --url devnet
solana airdrop 2

anchor build
anchor deploy
```

Update Program ID in `lib.rs`, `constants.ts`, and `Anchor.toml`. Copy IDL:
```bash
cp target/idl/freelance_ve.json frontend/idl/
```

### 3. Start frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 4. Test with wallet

1. Install Phantom → switch to Devnet
2. Get SOL: `solana airdrop 2 <your-phantom-address>`
3. Register as freelancer → publish a service (signs on-chain)
4. Switch to another wallet → hire the service (USDC → escrow)
5. Complete the order lifecycle: deliver → approve → USDC released

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="Wira <onboarding@resend.dev>"

# Auth
JWT_SECRET=your-random-secret-key-at-least-32-chars

# File Security
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# Solana (optional)
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

---

## Security

- **Escrow funds** are controlled by PDA signers — no admin can withdraw
- **Deadline enforcement** is on-chain via `Clock` sysvar — not spoofable
- **Order state transitions** are enforced in Rust — cannot skip steps
- **File uploads** are scanned by VirusTotal before storage
- **Auth** uses JWT + OTP — no passwords stored
- **RLS** enabled on all Supabase tables

---

## What Makes This Different

| Feature | Wira | Fiverr/Upwork | Other Crypto |
|---------|------|---------------|-------------|
| Platform fee | **0%** | 20% | 0-5% |
| Payment speed | **~2 seconds** | 14 days | Varies |
| Escrow | **On-chain PDA** | Centralized | Usually none |
| Refund | **Automatic (deadline)** | Manual dispute | N/A |
| Bank required | **No** | Yes | Sometimes |
| Identity required | **No** | Yes | Sometimes |
| File security | **VirusTotal scan** | Basic | None |

---

## Roadmap

- [ ] Mainnet deployment
- [ ] Reputation scores aggregated on-chain
- [ ] Multi-milestone orders with partial releases
- [ ] Dispute arbitration DAO
- [ ] Mobile app (React Native)
- [ ] Compressed NFT certificates for completed work

---

## License

MIT — see [LICENSE](./LICENSE)
