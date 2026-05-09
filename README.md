# Wira — Decentralized Freelance Marketplace on Solana

> **Hire talent. Get paid in USDC. No banks. No borders. Trustless escrow.**

Wira is a freelance marketplace on **Solana** where every payment flows through an **on-chain USDC escrow**. Freelancers publish services, clients hire with one click, and funds are locked in a PDA-controlled token account until the work is approved.

Built for the **Latin American remote worker** who needs fast, borderless, censorship-resistant payments.

---

## Live Demo & Addresses

| | |
|--|--|
| **App** | [frontend-mauve-kappa-18.vercel.app](https://frontend-mauve-kappa-18.vercel.app) |
| **Program ID** | [`6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb`](https://explorer.solana.com/address/6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb?cluster=devnet) |
| **USDC Mint (Devnet)** | [`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`](https://explorer.solana.com/address/4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU?cluster=devnet) |
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

## Complete Tech Stack

| Layer | Technology | Version / Details |
|---|---|---|
| **Smart Contract** | Rust + Anchor | 0.29 |
| **Blockchain** | Solana | Devnet |
| **Token** | USDC (SPL Token) | Devnet mint |
| **Frontend Framework** | Next.js | 14.2.0 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.3 + tailwindcss-animate |
| **UI Components** | Radix UI | Avatar, Dialog, Dropdown, Separator, Tabs, Tooltip |
| **Component Variants** | class-variance-authority | 0.7 |
| **Icons** | Lucide React | 1.14 |
| **Wallet Adapter** | @solana/wallet-adapter-react | 0.15.35 (Phantom, Solflare, Backpack) |
| **Mobile Wallet** | @solana-mobile/wallet-adapter-mobile | 2.1.3 (Saga/Seeker) |
| **Solana SDK** | @solana/web3.js | 1.91 |
| **SPL Token** | @solana/spl-token | 0.4 |
| **Anchor Client** | @coral-xyz/anchor | 0.29 |
| **Database** | Supabase (PostgreSQL) | RLS + Realtime + Storage |
| **Auth (Email)** | Resend (OTP) | + JWT (jose) |
| **Auth (Wallet)** | Solana Wallet Signature | Wallet-first login |
| **File Security** | VirusTotal API v3 | SHA-256 hash + full scan |
| **AI / LLM** | OpenRouter → Llama 3.1 8B | Smart search + copywriting |
| **Notifications** | Resend (transactional email) | Order + message alerts |
| **File Storage** | Supabase Storage | Attachments bucket |
| **Hosting** | Vercel | Edge + Serverless |
| **Design System** | Neobrutalism | Custom, mobile-first |
| **Animations** | Scroll-reveal (IntersectionObserver) | Landing page sections |
| **Toasts** | react-hot-toast | 2.4 |

---

## On-Chain Program (Anchor / Rust)

**Program ID:** `6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb`

**8 instructions · 5 PDA types · 3 on-chain accounts · 1 enum · 14 custom error codes**

### Instructions

| Instruction | Signer | Description |
|---|---|---|
| `register_freelancer` | Owner | Creates PDA profile with nombre, bio, categoría, skills (max 5) |
| `update_profile` | Owner | Updates freelancer profile fields |
| `create_service` | Owner | Creates service listing with USDC price + delivery deadline |
| `toggle_service` | Freelancer | Pause/resume service (`has_one = freelancer`) |
| `place_order` | Client | USDC → escrow PDA via SPL CPI (self-deal blocked) |
| `deliver_order` | Freelancer | Marks order as delivered (`has_one = freelancer`) |
| `approve_order` | Client | Releases escrow USDC → freelancer ATA (`has_one = client`) |
| `refund_order` | Client | Returns USDC after deadline (`has_one = client` + Clock check) |

### On-Chain Accounts

| Account | Seeds | Fields |
|---|---|---|
| `FreelancerProfile` | `["profile", owner]` | owner, nombre, bio, categoria, skills[], jobsCompleted, totalEarned, rating, serviceCount, createdAt, bump |
| `ServiceListing` | `["service", owner, service_count]` | freelancer, titulo, descripcion, precioUsdc, deliveryDays, categoria, activo, ordersCount, createdAt, bump |
| `Order` | `["order", service, orders_count]` | client, freelancer, service, amount, status (enum), deadline, createdAt, bump, escrowBump |

### PDA Architecture

| PDA | Seeds | Purpose |
|---|---|---|
| `FreelancerProfile` | `["profile", owner]` | Freelancer identity + stats |
| `ServiceListing` | `["service", owner, service_count_le_bytes]` | Service listing |
| `Order` | `["order", service, orders_count_le_bytes]` | Order state machine |
| `EscrowAuthority` | `["escrow", order]` | PDA authority for token account |
| `EscrowTokenAccount` | `["escrow_token", order]` | Holds USDC during escrow |

### Escrow Flow

```
Client → place_order() → USDC locked in PDA escrow
                ↓
Freelancer → deliver_order() → status: Delivered
                ↓
Client → approve_order() → USDC released to freelancer ATA
         OR
Client → refund_order() → USDC returned (after deadline via Clock sysvar)
```

### Custom Error Codes (14)

| Code | Name | Description |
|---|---|---|
| 6000 | `InvalidStatus` | Invalid order status for this operation |
| 6001 | `Unauthorized` | Not authorized |
| 6002 | `DeadlineNotReached` | Deadline has not been reached yet |
| 6003 | `DeadlinePassed` | Deadline has already passed |
| 6004 | `PriceTooLow` | Price must be ≥ 1 USDC |
| 6005 | `PriceTooHigh` | Price exceeds 1,000,000 USDC |
| 6006 | `InvalidDeliveryDays` | Delivery days must be 1–30 |
| 6007 | `NameTooLong` | Name ≤ 50 chars |
| 6008 | `BioTooLong` | Bio ≤ 200 chars |
| 6009 | `InputTooLong` | Input exceeds max length |
| 6010 | `TooManySkills` | Max 5 skills |
| 6011 | `SelfDeal` | Cannot order own service |
| 6012 | `Overflow` | Arithmetic overflow |
| 6013 | `MintMismatch` | Token mint mismatch |

### Security Hardening

Full audit in [`SECURITY.md`](./SECURITY.md) — 10 findings, all fixed:

- `has_one` constraints on all sensitive instructions
- Escrow bump pinned to stored value (no PDA confusion)
- Self-dealing prevention (`client ≠ freelancer`)
- Input length validation on all string fields
- Safe arithmetic (`checked_add` with typed errors)
- Token mint verification on escrow operations
- Escrow token account ownership verification

---

## All Active Functionalities

### 🔐 Authentication & Identity

| Feature | Details |
|---|---|
| **Wallet-first login** | Connect Phantom/Solflare/Backpack → auto-register flow |
| **Email OTP login** | 6-digit code via Resend → JWT session (7-day expiry, HS256) |
| **Dual auth** | Email session + wallet linked automatically |
| **Auto wallet-link** | Email user connects wallet → wallet auto-linked to profile |
| **Wallet-switch detection** | Switching wallet loads the correct profile |
| **Auto-logout on disconnect** | Wallet disconnect triggers session cleanup |
| **Profile persistence** | JWT stored via httpOnly cookie (`wira-session`) |

### 🛒 Marketplace

| Feature | Details |
|---|---|
| **Browse services** | Grid view with category filters |
| **Category filter** | Web Development, UI/UX Design, Smart Contracts, Marketing & SEO, Video & Motion, Other |
| **Text search** | Title + description search (ilike) |
| **AI Smart Search** | Natural language queries ranked by LLM (Llama 3.1 8B via OpenRouter) |
| **Auto-suggestions** | 50+ suggestions (Instagram, YouTube, TikTok, Web Dev, Blockchain, etc.) |
| **Service detail page** | Full info + owner profile + hire button |
| **YouTube video embed** | Services can include a demo video |
| **Image gallery** | Services support multiple images |

### 💼 Service Management

| Feature | Details |
|---|---|
| **Create service** | Title, description, price (USDC), delivery days, category |
| **On-chain publish** | Service created on Solana via Anchor CPI |
| **AI Service Enhancer** | One-click AI copywriting for titles & descriptions |
| **Edit service** | Update all fields |
| **Delete service** | Remove from Supabase |
| **Toggle active/inactive** | Pause/resume on-chain (`toggle_service`) |

### 📦 Order Lifecycle

| Feature | Details |
|---|---|
| **Place order** | Client hires → USDC locked in PDA escrow on-chain |
| **Accept order** | Freelancer accepts within 24h (status: `pending` → `accepted`) |
| **Deliver order** | Freelancer marks delivered on-chain |
| **Approve order** | Client approves → USDC released to freelancer on-chain |
| **Refund order** | Client refunds after deadline via Clock sysvar |
| **Cancel order** | Admin can cancel orders |
| **Order statuses** | `pending` → `accepted` → `in_progress` → `delivered` → `completed` / `refunded` / `cancelled` |
| **Transaction links** | Deep links to Solana Explorer for every tx |
| **Order history** | Full list with status badges and filters |

### 🧾 Invoice Generator

| Feature | Details |
|---|---|
| **Auto-generated invoices** | Per-order invoices with service details, amounts, dates |
| **Transaction signatures** | Solana tx signatures included in invoice |
| **USDC amounts** | Displayed with USDC branding |

### 💬 Real-Time Messaging

| Feature | Details |
|---|---|
| **Order chat** | Per-order messaging between client and freelancer |
| **Direct messages (DMs)** | Pre-order conversation between any two users |
| **Real-time delivery** | Supabase Realtime (Postgres Changes) |
| **Read receipts** | `delivered_at` + `read_at` timestamps |
| **Typing indicators** | Real-time `typing_status` table with Supabase Realtime |
| **File attachments** | Upload images/PDFs to Supabase Storage |
| **VirusTotal scanning** | Uploaded files scanned via VT API (SHA-256 hash check + full upload) |
| **Inbox view** | Unified inbox with conversation list + unread counts |
| **Smart notifications** | Email notification every 3rd unread message (throttled) |

### 👤 Profiles & Public Pages

| Feature | Details |
|---|---|
| **Profile creation** | Name, bio, role (freelancer/employer/both), category, skills |
| **Username** | Unique username for public profile URL |
| **Avatar upload** | Profile photo via Supabase Storage |
| **Social links** | Twitter, Instagram, GitHub, LinkedIn, Website, Telegram |
| **Portfolio** | Array of portfolio items with title, URL, description, file |
| **Public profile pages** | `/u/[username]` — shareable public profile |
| **Profile edit page** | `/profile/edit` — full profile editor with identity verification |
| **Wallet profile** | `/profile/[wallet]` — view profile by wallet address |
| **Skills with autocomplete** | 50+ skill suggestions (Solana-focused) |
| **Last seen tracking** | `last_seen` timestamp on profiles |

### ⭐ Reviews & Ratings

| Feature | Details |
|---|---|
| **Post-order reviews** | Client reviews freelancer after completion |
| **1-5 star rating** | With optional comment |
| **Freelancer review list** | All reviews displayed on profile |
| **One review per order** | Enforced via unique constraint |

### 🛡️ Admin Panel

| Feature | Details |
|---|---|
| **Dashboard** | `/admin` — overview of all platform data |
| **Order management** | View all orders, filter by status, cancel/refund |
| **User management** | View all profiles, block/unblock users |
| **Service management** | View all services |
| **Report management** | View abuse reports with reporter details |
| **Block user** | Sets `blocked_at` timestamp |

### 🚨 Abuse Reporting

| Feature | Details |
|---|---|
| **Report service** | Flag a service with reason + details |
| **Report user** | Flag a user profile |
| **Report message** | Flag a message |
| **Report dashboard** | Admin views all reports |

### 📧 Email Notifications (Resend)

| Feature | Details |
|---|---|
| **OTP login codes** | 6-digit code sent via Resend |
| **New order alert** | Freelancer gets email when order is placed |
| **Unread messages** | Email digest every 3rd unread message |
| **Custom HTML templates** | Branded neobrutalist email design |
| **Configurable sender** | `EMAIL_FROM` env var |

### 🌐 Internationalization (i18n)

| Feature | Details |
|---|---|
| **Languages** | English (EN) + Spanish (ES) |
| **Instant switch** | Client-side language toggle, no reload |
| **Coverage** | Navigation, Hero, Services, About, How It Works, Testimonials, Footer, Login, Register, Marketplace, Dashboard |
| **Language context** | React Context + localStorage persistence |

### 📱 Solana Mobile Support

| Feature | Details |
|---|---|
| **MWA protocol** | `@solana-mobile/wallet-adapter-mobile` |
| **Android support** | On-device wallet signing from Chrome |
| **Saga/Seeker** | Compatible with Solana Mobile devices |
| **PWA-ready** | Architecture supports future dApp Store (TWA) |

### 🎨 Design & UX

| Feature | Details |
|---|---|
| **Neobrutalist UI** | Bold borders, heavy shadows, flat colors |
| **Mobile-first** | Responsive across all breakpoints |
| **Scroll animations** | IntersectionObserver-based reveal animations |
| **Landing page** | Hero, Services, About, How It Works, Testimonials, Articles, Portfolio, Footer |
| **Logo marquee** | Animated scrolling brand strip |
| **USDC price display** | Real-time price badge component |
| **Dark mode support** | Via Tailwind CSS dark mode utilities |
| **Custom components** | ServiceCard, OrderCard, ProfileCard, USDCBadge, ScrollReveal |

---

## Integrations

| Integration | API / Protocol | Purpose |
|---|---|---|
| **Solana Blockchain** | @solana/web3.js + Anchor | Smart contract interaction, PDA derivation, escrow lifecycle |
| **SPL Token Program** | @solana/spl-token | USDC transfers via CPI (place_order, approve, refund) |
| **Supabase** | REST + Realtime (WebSocket) + Storage | Database, auth, real-time messaging, file storage |
| **OpenRouter AI** | REST API → Llama 3.1 8B | Smart search ranking + service description enhancer |
| **Resend** | REST API | OTP emails + transactional notifications |
| **VirusTotal** | REST API v3 | File malware scanning (SHA-256 hash + full upload) |
| **Solana Explorer** | URL linking | Transaction verification deep links |
| **Solana Mobile** | MWA protocol | Mobile wallet adapter for Android |
| **Vercel** | Hosting + Serverless Functions | Deployment + API routes |

---

## Solana SDK Usage

- **5 PDA types** with distinct seed schemas
- **`CpiContext::new_with_signer`** — PDA-signed SPL token transfers
- **`token::transfer` CPI** — Cross-program invocation for USDC
- **`Clock` sysvar** — Deadline enforcement for refunds
- **Anchor constraints** — `init`, `mut`, `has_one`, `seeds`, `bump`
- **14 custom error codes** — typed errors for every failure mode
- **State machine** — InProgress → Delivered → Completed/Refunded
- **Mobile Wallet Adapter** — `@solana-mobile/wallet-adapter-mobile` for Saga/Seeker

---

## Database Schema (Supabase / PostgreSQL)

**7 tables · RLS enabled · Realtime on DMs + Typing**

| Table | Purpose | Key Fields |
|---|---|---|
| `profiles` | User identity | email, wallet_address, nombre, username, bio, role, categoria, skills[], avatar_url, social_links (JSONB), portfolio (JSONB), last_seen, blocked_at |
| `services` | Service listings | owner_id, titulo, descripcion, precio_usdc, delivery_days, categoria, activo, youtube_url, images[] |
| `orders` | Order lifecycle | service_id, client_id, freelancer_id, amount_usdc, status, tx_signature, accepted_at |
| `messages` | Per-order chat | order_id, sender_id, content, file_url, file_name, file_type, delivered_at, read_at |
| `direct_messages` | DMs between users | sender_id, receiver_id, content, file_url, read, delivered_at, read_at |
| `reviews` | Post-order reviews | order_id, reviewer_id, freelancer_id, rating (1-5), comment |
| `reports` | Abuse reports | reporter_id, reported_service_id, reported_user_id, reported_message_id, reason, details, status |
| `typing_status` | Real-time typing | user_id, chat_partner_id, is_typing, updated_at |

---

## API Routes (Next.js)

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/send-otp` | POST | Generate 6-digit OTP → send via Resend |
| `/api/auth/verify-otp` | POST | Verify OTP → create JWT session |
| `/api/auth/session` | GET | Return current session |
| `/api/auth/session` | DELETE | Destroy session (logout) |
| `/api/auth/update-profile` | POST | Update profile fields |
| `/api/ai` | POST | AI enhance (copywriting) or AI search (semantic ranking) |
| `/api/upload` | POST | File upload with VirusTotal malware scanning |
| `/api/notify` | POST | Send email notifications (new_order, new_message) |

---

## Frontend Pages (12 routes)

| Route | Page |
|---|---|
| `/` | Landing page (Hero, Services, About, How It Works, Testimonials) |
| `/marketplace` | Browse & search services |
| `/marketplace/[id]` | Service detail + hire |
| `/register` | Create account (role selection + OTP) |
| `/dashboard` | User dashboard (stats, recent orders, quick actions) |
| `/services/new` | Create new service |
| `/services/[id]` | Edit service |
| `/orders` | Order list |
| `/orders/[id]` | Order detail + chat + lifecycle actions |
| `/inbox` | DM inbox (conversation list) |
| `/chat/[userId]` | Direct message thread |
| `/profile/edit` | Edit profile + identity verification |
| `/profile/[wallet]` | View profile by wallet |
| `/u/[username]` | Public profile page |
| `/admin` | Admin panel (orders, users, services, reports) |
| `/terms` | Terms of service |

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

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# Auth
JWT_SECRET=

# VirusTotal
VIRUSTOTAL_API_KEY=

# AI (OpenRouter)
OPENROUTER_API_KEY=
```

### Test Flow

1. Install [Phantom](https://phantom.app/) → switch to Devnet
2. `solana airdrop 2 <phantom-address>`
3. Connect wallet → register → publish service (signs on-chain)
4. Second wallet → hire service → USDC locked in escrow
5. Deliver → approve → USDC released to freelancer

---

## License

MIT
