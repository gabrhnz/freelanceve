import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID, USDC_MINT_DEVNET, RPC_URL } from "./constants";
import IDL from "@/idl/freelance_ve.json";

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as any, PROGRAM_ID, provider);
}

export function getConnection() {
  return new Connection(RPC_URL, "confirmed");
}

// ─── PDA derivations (must match Anchor seeds exactly) ───

export function getProfilePDA(owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), owner.toBuffer()],
    PROGRAM_ID
  );
}

export function getServicePDA(owner: PublicKey, serviceIndex: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(serviceIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("service"), owner.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function getOrderPDA(servicePubkey: PublicKey, ordersCount: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(ordersCount);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("order"), servicePubkey.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function getEscrowAuthorityPDA(orderPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), orderPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function getEscrowTokenPDA(orderPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_token"), orderPubkey.toBuffer()],
    PROGRAM_ID
  );
}

// ─── Check if on-chain account exists ───

async function accountExists(connection: Connection, pubkey: PublicKey): Promise<boolean> {
  const info = await connection.getAccountInfo(pubkey);
  return info !== null;
}

// ─── Read-only check: does this freelancer have a service on-chain? ───
// Works without AnchorProvider — uses raw account reads

export async function checkServiceExistsOnChain(
  freelancerWallet: string,
): Promise<boolean> {
  try {
    const connection = getConnection();
    const freelancerPubkey = new PublicKey(freelancerWallet);
    const [profilePDA] = getProfilePDA(freelancerPubkey);

    const profileInfo = await connection.getAccountInfo(profilePDA);
    if (!profileInfo) return false;

    // Parse service_count from profile data (offset: 8 discriminator + 32 owner + 4+50 nombre + 4+200 bio + 4+50 categoria)
    // This is fragile with Borsh, so instead check if service PDAs exist directly
    // Try up to 5 service indexes
    for (let i = 0; i < 5; i++) {
      const [servicePDA] = getServicePDA(freelancerPubkey, i);
      const serviceInfo = await connection.getAccountInfo(servicePDA);
      if (serviceInfo) return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Register freelancer profile on-chain ───

export async function registerFreelancerOnChain(
  provider: AnchorProvider,
  data: { nombre: string; bio: string; categoria: string; skills: string[] },
): Promise<string> {
  const program = getProgram(provider);
  const owner = provider.wallet.publicKey;
  const [profilePDA] = getProfilePDA(owner);

  const tx = await program.methods
    .registerFreelancer(
      data.nombre.slice(0, 50),
      data.bio.slice(0, 200),
      data.categoria.slice(0, 50),
      data.skills.slice(0, 5).map((s) => s.slice(0, 30)),
    )
    .accounts({
      profile: profilePDA,
      owner: owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

// ─── Create service on-chain ───

export async function createServiceOnChain(
  provider: AnchorProvider,
  data: { titulo: string; descripcion: string; precioUsdc: number; deliveryDays: number; categoria: string },
): Promise<{ tx: string; servicePDA: PublicKey }> {
  const program = getProgram(provider);
  const owner = provider.wallet.publicKey;
  const [profilePDA] = getProfilePDA(owner);

  // Read current service_count to derive the next service PDA
  const profileAccount = await program.account.freelancerProfile.fetch(profilePDA);
  const serviceIndex = (profileAccount as any).serviceCount as number;
  const [servicePDA] = getServicePDA(owner, serviceIndex);

  const precioMicroUsdc = new BN(Math.round(data.precioUsdc * 1_000_000));

  const tx = await program.methods
    .createService(
      data.titulo.slice(0, 100),
      data.descripcion.slice(0, 500),
      precioMicroUsdc,
      data.deliveryDays,
      data.categoria.slice(0, 50),
    )
    .accounts({
      service: servicePDA,
      profile: profilePDA,
      owner: owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx, servicePDA };
}

// ─── Publish service: register profile if needed, then create service on-chain ───

export async function publishServiceOnChain(
  provider: AnchorProvider,
  profileData: { nombre: string; bio: string; categoria: string; skills: string[] },
  serviceData: { titulo: string; descripcion: string; precioUsdc: number; deliveryDays: number; categoria: string },
): Promise<{ servicePDA: PublicKey; txSignatures: string[] }> {
  const connection = provider.connection;
  const owner = provider.wallet.publicKey;
  const [profilePDA] = getProfilePDA(owner);
  const txSignatures: string[] = [];

  // Step 1: Register profile if it doesn't exist on-chain
  const profileExists = await accountExists(connection, profilePDA);
  if (!profileExists) {
    const regTx = await registerFreelancerOnChain(provider, profileData);
    txSignatures.push(regTx);
  }

  // Step 2: Create service on-chain
  const { tx, servicePDA } = await createServiceOnChain(provider, serviceData);
  txSignatures.push(tx);

  return { servicePDA, txSignatures };
}

// ─── Find existing on-chain service for a freelancer ───

export async function findOnChainService(
  provider: AnchorProvider,
  freelancerPubkey: PublicKey,
): Promise<{ profilePDA: PublicKey; servicePDA: PublicKey; serviceIndex: number }> {
  const program = getProgram(provider);
  const connection = provider.connection;

  const [profilePDA] = getProfilePDA(freelancerPubkey);

  const profileExists = await accountExists(connection, profilePDA);
  if (!profileExists) {
    throw new Error("PROFILE_NOT_INITIALIZED");
  }

  const profileAccount = await program.account.freelancerProfile.fetch(profilePDA);
  const serviceCount = (profileAccount as any).serviceCount as number;

  for (let i = 0; i < serviceCount; i++) {
    const [sPDA] = getServicePDA(freelancerPubkey, i);
    const exists = await accountExists(connection, sPDA);
    if (exists) {
      return { profilePDA, servicePDA: sPDA, serviceIndex: i };
    }
  }

  throw new Error("SERVICE_NOT_INITIALIZED");
}

// ─── Place order on-chain ───

export async function placeOrderOnChain(
  provider: AnchorProvider,
  servicePubkey: PublicKey,
): Promise<string> {
  const program = getProgram(provider);
  const client = provider.wallet.publicKey;
  const connection = provider.connection;

  // Read service to get orders_count for the order PDA seed
  const serviceAccount = await program.account.serviceListing.fetch(servicePubkey);
  const ordersCount = (serviceAccount as any).ordersCount as number;

  // Derive order PDA
  const [orderPDA] = getOrderPDA(servicePubkey, ordersCount);

  // Derive escrow PDAs
  const [escrowAuthority] = getEscrowAuthorityPDA(orderPDA);

  // Client's USDC ATA
  const clientUsdc = await getAssociatedTokenAddress(USDC_MINT_DEVNET, client);

  const tx = await program.methods
    .placeOrder()
    .accounts({
      order: orderPDA,
      service: servicePubkey,
      client: client,
      clientUsdc: clientUsdc,
      escrowUsdc: getEscrowTokenPDA(orderPDA)[0],
      escrowAuthority: escrowAuthority,
      usdcMint: USDC_MINT_DEVNET,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return tx;
}

// ─── Deliver order on-chain (freelancer) ───

export async function deliverOrderOnChain(
  provider: AnchorProvider,
  orderPubkey: PublicKey,
): Promise<string> {
  const program = getProgram(provider);
  const freelancer = provider.wallet.publicKey;

  const tx = await program.methods
    .deliverOrder()
    .accounts({
      order: orderPubkey,
      freelancer: freelancer,
    })
    .rpc();

  return tx;
}

// ─── Approve order on-chain (client releases USDC to freelancer) ───

export async function approveOrderOnChain(
  provider: AnchorProvider,
  orderPubkey: PublicKey,
  freelancerPubkey: PublicKey,
): Promise<string> {
  const program = getProgram(provider);
  const [escrowAuthority] = getEscrowAuthorityPDA(orderPubkey);
  const [freelancerProfilePDA] = getProfilePDA(freelancerPubkey);
  const freelancerUsdc = await getAssociatedTokenAddress(USDC_MINT_DEVNET, freelancerPubkey);

  const tx = await program.methods
    .approveOrder()
    .accounts({
      order: orderPubkey,
      escrowUsdc: getEscrowTokenPDA(orderPubkey)[0],
      escrowAuthority: escrowAuthority,
      freelancerUsdc: freelancerUsdc,
      freelancerProfile: freelancerProfilePDA,
      client: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

// ─── Refund order on-chain (after deadline) ───

export async function refundOrderOnChain(
  provider: AnchorProvider,
  orderPubkey: PublicKey,
  clientPubkey: PublicKey,
): Promise<string> {
  const program = getProgram(provider);
  const [escrowAuthority] = getEscrowAuthorityPDA(orderPubkey);
  const clientUsdc = await getAssociatedTokenAddress(USDC_MINT_DEVNET, clientPubkey);

  const tx = await program.methods
    .refundOrder()
    .accounts({
      order: orderPubkey,
      escrowUsdc: getEscrowTokenPDA(orderPubkey)[0],
      escrowAuthority: escrowAuthority,
      clientUsdc: clientUsdc,
      client: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

// ─── Find on-chain order PDA for an existing order ───

export async function findOnChainOrder(
  provider: AnchorProvider,
  freelancerPubkey: PublicKey,
  clientPubkey: PublicKey,
): Promise<PublicKey | null> {
  const program = getProgram(provider);
  const connection = provider.connection;

  // Find the freelancer's service PDA
  const [profilePDA] = getProfilePDA(freelancerPubkey);
  const profileExists = await accountExists(connection, profilePDA);
  if (!profileExists) return null;

  const profileAccount = await program.account.freelancerProfile.fetch(profilePDA);
  const serviceCount = (profileAccount as any).serviceCount as number;

  // For each service, check each order
  for (let si = 0; si < serviceCount; si++) {
    const [servicePDA] = getServicePDA(freelancerPubkey, si);
    const serviceExists = await accountExists(connection, servicePDA);
    if (!serviceExists) continue;

    const serviceAccount = await program.account.serviceListing.fetch(servicePDA);
    const ordersCount = (serviceAccount as any).ordersCount as number;

    for (let oi = 0; oi < ordersCount; oi++) {
      const [orderPDA] = getOrderPDA(servicePDA, oi);
      try {
        const orderAccount = await program.account.order.fetch(orderPDA);
        const acc = orderAccount as any;
        if (
          acc.client.toBase58() === clientPubkey.toBase58() &&
          acc.freelancer.toBase58() === freelancerPubkey.toBase58()
        ) {
          return orderPDA;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

// ─── Solana Explorer URL helper ───

export function getExplorerUrl(signature: string, type: "tx" | "address" = "tx"): string {
  return `https://explorer.solana.com/${type}/${signature}?cluster=devnet`;
}

// ─── Backward-compat aliases (used by orders page via anchor.ts) ───

export const findProfilePDA = getProfilePDA;
export const findServicePDA = getServicePDA;
export const findOrderPDA = getOrderPDA;
export const findEscrowAuthorityPDA = getEscrowAuthorityPDA;
export const findEscrowTokenPDA = getEscrowTokenPDA;
