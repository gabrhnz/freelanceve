import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "@/idl/freelance_ve.json";
import { PROGRAM_ID, RPC_URL } from "./constants";

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = new Connection(RPC_URL, "confirmed");
  return new AnchorProvider(connection, wallet, {
    preflightCommitment: "confirmed",
  });
}

export function getProgram(wallet: AnchorWallet): Program {
  const provider = getProvider(wallet);
  return new Program(idl as Idl, PROGRAM_ID, provider);
}

export function getReadonlyProgram(): Program {
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(
    connection,
    {} as AnchorWallet,
    { preflightCommitment: "confirmed" }
  );
  return new Program(idl as Idl, PROGRAM_ID, provider);
}

export function findProfilePDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function findServicePDA(
  wallet: PublicKey,
  serviceCount: number
): [PublicKey, number] {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(serviceCount);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("service"), wallet.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function findOrderPDA(
  serviceKey: PublicKey,
  ordersCount: number
): [PublicKey, number] {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(ordersCount);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("order"), serviceKey.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function findEscrowAuthorityPDA(
  orderKey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), orderKey.toBuffer()],
    PROGRAM_ID
  );
}

export function findEscrowTokenPDA(
  orderKey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow_token"), orderKey.toBuffer()],
    PROGRAM_ID
  );
}
