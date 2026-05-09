# Security Audit Report — Wira (FreelanceVE)

**Program ID:** `6zjwrFhvtcub6FYvb3kZCGTXLT3pzH2fQmyjFhM5WQSb`  
**Network:** Solana Devnet  
**Framework:** Anchor 0.29  
**Audit date:** May 2025  

---

## Summary

Internal security review of the Wira escrow smart contract. All critical and high-severity issues identified were resolved.

| Severity | Found | Fixed |
|----------|-------|-------|
| 🔴 Critical | 2 | 2 |
| 🟠 High | 3 | 3 |
| 🟡 Medium | 3 | 3 |
| 🟢 Low | 2 | 2 |

---

## Findings & Fixes

### 🔴 CRITICAL-01: Unrestricted Refund — Anyone Could Drain Escrow

**Before:** `RefundOrder` accepted any `signer` — no verification that signer == `order.client`.  
**Impact:** Any wallet could call `refund_order` after deadline, draining escrow funds to the client's token account.  
**Fix:** Renamed `signer` to `client`, added `has_one = client` constraint, and added explicit `require!(order.client == ctx.accounts.client.key())` in instruction body.

### 🔴 CRITICAL-02: Missing Owner Validation on ToggleService

**Before:** `ToggleService` had no PDA seed verification — only a runtime `require!` check.  
**Impact:** Attacker could pass an arbitrary `ServiceListing` account and toggle any service active/inactive.  
**Fix:** Added `has_one = freelancer` Anchor constraint, which validates `service.freelancer == freelancer.key()` at the account validation level.

### 🟠 HIGH-01: Missing `has_one` on ApproveOrder

**Before:** `ApproveOrder.client` signer was not verified against `order.client`.  
**Impact:** Any wallet could release escrow funds to the freelancer.  
**Fix:** Added `has_one = client` constraint on `order` account.

### 🟠 HIGH-02: Missing `has_one` on DeliverOrder

**Before:** `DeliverOrder` had no Anchor-level constraint — only a runtime `require!`.  
**Impact:** While the runtime check prevented exploitation, best practice is defense-in-depth at the deserialization layer.  
**Fix:** Added `has_one = freelancer` constraint.

### 🟠 HIGH-03: Escrow Authority Bump Not Pinned

**Before:** `ApproveOrder` and `RefundOrder` used `bump` (auto-derived) instead of `order.escrow_bump` (stored at init).  
**Impact:** Theoretical PDA confusion if bump values differ.  
**Fix:** Changed to `bump = order.escrow_bump` to pin the bump to the value stored during `place_order`.

### 🟡 MEDIUM-01: Self-Dealing — Client Can Order Own Service

**Before:** No check preventing `client == service.freelancer`.  
**Impact:** Freelancer could place orders on their own services to inflate `orders_count` and `jobs_completed`.  
**Fix:** Added `require!(client.key() != service.freelancer, SelfDeal)`.

### 🟡 MEDIUM-02: Unchecked Input Lengths

**Before:** `titulo`, `descripcion`, `categoria`, and individual `skills` had no length validation.  
**Impact:** Oversized inputs could exceed account space allocation, causing transaction failure or unexpected behavior.  
**Fix:** Added `require!` checks: titulo ≤ 100, descripcion ≤ 500, categoria ≤ 50, each skill ≤ 30, skills.len() ≤ 5.

### 🟡 MEDIUM-03: No Price Upper Bound

**Before:** Only minimum price (1 USDC) was validated.  
**Impact:** Accidental or malicious creation of services with astronomically high prices.  
**Fix:** Added `precio_usdc <= 1_000_000_000_000` (max 1M USDC).

### 🟢 LOW-01: Panic on Arithmetic Overflow

**Before:** `checked_add().unwrap()` would panic, aborting the transaction with an opaque error.  
**Impact:** Poor error reporting; harder to debug.  
**Fix:** Changed to `checked_add().ok_or(FreelanceError::Overflow)?` for all arithmetic operations.

### 🟢 LOW-02: Missing Escrow Token Account Ownership Verification

**Before:** `escrow_usdc.owner` was not verified against `escrow_authority.key()`.  
**Impact:** Theoretical account substitution attack.  
**Fix:** Added `constraint = escrow_usdc.owner == escrow_authority.key()` on both `ApproveOrder` and `RefundOrder`.

---

## Security Model

### Escrow Flow
```
Client → place_order() → USDC locked in PDA-owned escrow token account
                ↓
Freelancer → deliver_order() → status: Delivered
                ↓
Client → approve_order() → USDC released to freelancer ATA
                              + profile stats updated
                ↓ (if deadline passed)
Client → refund_order() → USDC returned to client ATA
```

### Access Control Matrix

| Instruction | Authorized Signer | Constraint Method |
|---|---|---|
| `register_freelancer` | Owner (new profile) | PDA seeds: `[profile, owner]` |
| `update_profile` | Profile owner | PDA seeds + `require!` |
| `create_service` | Profile owner | PDA seeds + `require!` |
| `toggle_service` | Service freelancer | `has_one = freelancer` |
| `place_order` | Client (≠ freelancer) | Signer + `SelfDeal` check |
| `deliver_order` | Order freelancer | `has_one = freelancer` |
| `approve_order` | Order client | `has_one = client` |
| `refund_order` | Order client | `has_one = client` + deadline check |

### PDA Seeds

| Account | Seeds |
|---|---|
| `FreelancerProfile` | `["profile", owner]` |
| `ServiceListing` | `["service", owner, service_count_le_bytes]` |
| `Order` | `["order", service, orders_count_le_bytes]` |
| `EscrowAuthority` | `["escrow", order]` |
| `EscrowTokenAccount` | `["escrow_token", order]` |

---

## Remaining Considerations (Non-blocking)

- **Dispute resolution:** Current model is binary (approve or refund after deadline). A future version could add an arbitration mechanism.
- **Rate limiting:** No on-chain rate limiting for order creation. Mitigated by SOL transaction fees.
- **Token-2022:** Program uses legacy SPL Token. Token Extensions support can be added later.
- **Program upgrade authority:** Should be set to a multisig or removed before mainnet.
