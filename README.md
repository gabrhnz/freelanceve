# 🇻🇪 FreelanceVE — Freelancers venezolanos on-chain

> **Cobra en USDC. Sin bancos. Sin fronteras.**

FreelanceVE es una plataforma descentralizada para freelancers venezolanos que permite ofrecer servicios y recibir pagos en **USDC** (stablecoin) directamente a través de la blockchain de **Solana**. Piénsalo como un **Fiverr on-chain**.

---

## El Problema

Venezuela enfrenta restricciones bancarias severas, hiperinflación y acceso limitado a plataformas internacionales de freelance. Los freelancers venezolanos:

- No pueden recibir pagos en dólares fácilmente
- Sufren comisiones abusivas de intermediarios
- Dependen de bancos que congelan cuentas
- No tienen acceso a PayPal, Stripe u otros procesadores

## La Solución

FreelanceVE elimina todos los intermediarios:

- **Pagos en USDC**: Estables, en dólares, sin inflación
- **Escrow on-chain**: Los fondos se depositan en un escrow inteligente hasta que el cliente aprueba el trabajo
- **Sin bancos**: Solo necesitas una wallet de Solana (Phantom/Backpack)
- **Transparente**: Todo queda registrado en la blockchain
- **Rápido y barato**: Las transacciones en Solana cuestan fracciones de centavo

---

## Screenshots

> _Screenshots serán añadidos próximamente_

| Landing | Dashboard | Servicio |
|---------|-----------|----------|
| ![Landing](./screenshots/landing.png) | ![Dashboard](./screenshots/dashboard.png) | ![Service](./screenshots/service.png) |

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Blockchain** | Solana (Devnet) |
| **Smart Contract** | Anchor Framework (Rust) |
| **Wallet** | @solana/wallet-adapter (Phantom, Backpack) |
| **Token** | USDC (Devnet: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`) |
| **Deploy** | Vercel (Frontend), Solana Devnet (Programa) |

---

## Arquitectura del Programa

### Instrucciones

| Instrucción | Descripción |
|-------------|-------------|
| `register_freelancer` | Registra un perfil de freelancer (PDA) |
| `update_profile` | Actualiza nombre, bio y skills |
| `create_service` | Publica un nuevo servicio con precio en USDC |
| `toggle_service` | Activa o pausa un servicio |
| `place_order` | Cliente contrata un servicio, USDC va al escrow |
| `deliver_order` | Freelancer marca la orden como entregada |
| `approve_order` | Cliente aprueba, USDC se libera al freelancer |
| `refund_order` | Reembolso automático si pasa el deadline |

### Cuentas (PDAs)

- **FreelancerProfile**: `["profile", wallet]`
- **ServiceListing**: `["service", wallet, service_count]`
- **Order**: `["order", service_key, orders_count]`
- **Escrow**: `["escrow", order_key]` (authority) + `["escrow_token", order_key]` (token account)

---

## Setup Local

### Prerrequisitos

- [Rust](https://rustup.rs/) + Cargo
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) v1.17+
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) v0.29+
- [Node.js](https://nodejs.org/) v18+
- [Phantom Wallet](https://phantom.app/) (extensión del navegador)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/freelance-ve.git
cd freelance-ve
```

### 2. Configurar Solana para Devnet

```bash
solana config set --url devnet
solana-keygen new  # si no tienes keypair
solana airdrop 2   # obtener SOL de prueba
```

### 3. Build y deploy del programa

```bash
anchor build
anchor deploy
```

> Después del deploy, actualiza el Program ID en:
> - `Anchor.toml`
> - `programs/freelance-ve/src/lib.rs` (declare_id!)
> - `frontend/lib/constants.ts` (PROGRAM_ID)
> - `frontend/idl/freelance_ve.json` (reemplazar con el IDL generado en `target/idl/`)

### 4. Ejecutar tests

```bash
anchor test
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 6. Configurar wallet

1. Instala Phantom o Backpack
2. Cambia la red a **Devnet**
3. Obtén USDC de prueba en devnet (puedes usar el faucet de SPL tokens)

---

## Deploy en Vercel

El frontend está listo para Vercel:

```bash
cd frontend
npx vercel
```

O conecta el repositorio directamente desde el dashboard de Vercel.

---

## Contract Deployment (Devnet)

| Campo | Valor |
|-------|-------|
| **Program ID** | `FReeVe1111111111111111111111111111111111111` |
| **Network** | Solana Devnet |
| **USDC Mint** | `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` |

> ⚠️ El Program ID es un placeholder. Reemplázalo con tu ID real después del deploy.

---

## Demo

- **Live Demo**: _Próximamente_
- **Video Demo**: _Próximamente_

---

## Estructura del Proyecto

```
freelance-ve/
├── programs/freelance-ve/src/lib.rs   ← Programa Anchor (Rust)
├── tests/freelance-ve.ts              ← Tests
├── Anchor.toml
├── Cargo.toml
└── frontend/
    ├── app/                           ← Next.js App Router pages
    ├── components/                    ← React components
    ├── hooks/                         ← Custom hooks
    ├── lib/                           ← Utils, constants, Anchor setup
    └── idl/                           ← IDL del programa
```

---

## Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/mi-feature`
3. Haz commit: `git commit -m 'feat: mi nueva feature'`
4. Push: `git push origin feature/mi-feature`
5. Abre un Pull Request

---

## Licencia

MIT License — ver [LICENSE](./LICENSE) para más detalles.

---

**Hecho con ❤️ para Venezuela 🇻🇪**
