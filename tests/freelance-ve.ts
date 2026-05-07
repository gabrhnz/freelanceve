import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("freelance-ve", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FreelanceVe as Program;
  const owner = provider.wallet;

  let profilePDA: PublicKey;
  let profileBump: number;

  it("Registers a freelancer", async () => {
    [profilePDA, profileBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), owner.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .registerFreelancer(
        "María García",
        "Diseñadora gráfica con 5 años de experiencia",
        "Diseño",
        ["Figma", "Photoshop", "Illustrator"]
      )
      .accounts({
        profile: profilePDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const profile = await program.account.freelancerProfile.fetch(profilePDA);
    assert.equal(profile.nombre, "María García");
    assert.equal(profile.bio, "Diseñadora gráfica con 5 años de experiencia");
    assert.equal(profile.categoria, "Diseño");
    assert.equal(profile.skills.length, 3);
    assert.equal(profile.jobsCompleted, 0);
    assert.equal(profile.totalEarned.toNumber(), 0);
    assert.equal(profile.serviceCount, 0);
  });

  it("Updates profile", async () => {
    await program.methods
      .updateProfile(
        "María García V.",
        "Diseñadora UI/UX senior",
        ["Figma", "Photoshop", "Illustrator", "Sketch"]
      )
      .accounts({
        profile: profilePDA,
        owner: owner.publicKey,
      })
      .rpc();

    const profile = await program.account.freelancerProfile.fetch(profilePDA);
    assert.equal(profile.nombre, "María García V.");
    assert.equal(profile.skills.length, 4);
  });

  it("Creates a service", async () => {
    const serviceCount = 0;
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(serviceCount);

    const [servicePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("service"), owner.publicKey.toBuffer(), buf],
      program.programId
    );

    await program.methods
      .createService(
        "Diseño de Logo Profesional",
        "Logo personalizado con 3 propuestas y revisiones ilimitadas",
        new anchor.BN(5_000_000), // 5 USDC
        7,
        "Diseño"
      )
      .accounts({
        service: servicePDA,
        profile: profilePDA,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const service = await program.account.serviceListing.fetch(servicePDA);
    assert.equal(service.titulo, "Diseño de Logo Profesional");
    assert.equal(service.precioUsdc.toNumber(), 5_000_000);
    assert.equal(service.deliveryDays, 7);
    assert.equal(service.activo, true);
    assert.equal(service.ordersCount, 0);

    const profile = await program.account.freelancerProfile.fetch(profilePDA);
    assert.equal(profile.serviceCount, 1);
  });

  it("Toggles service off and on", async () => {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(0);

    const [servicePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("service"), owner.publicKey.toBuffer(), buf],
      program.programId
    );

    await program.methods
      .toggleService(false)
      .accounts({
        service: servicePDA,
        owner: owner.publicKey,
      })
      .rpc();

    let service = await program.account.serviceListing.fetch(servicePDA);
    assert.equal(service.activo, false);

    await program.methods
      .toggleService(true)
      .accounts({
        service: servicePDA,
        owner: owner.publicKey,
      })
      .rpc();

    service = await program.account.serviceListing.fetch(servicePDA);
    assert.equal(service.activo, true);
  });
});
