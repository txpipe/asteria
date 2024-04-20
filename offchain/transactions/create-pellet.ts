import { Data, toUnit, TxHash } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { lucidBase } from "../utils.ts";
import { AssetClassT, PelletDatum, PelletDatumT } from "../types.ts";

async function createPellet(
  admin_token: AssetClassT,
  fuel: bigint,
  pos_x: bigint,
  pos_y: bigint
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

  const pelletRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./script-refs/pellet-ref.json")
  );
  const pelletRef = await lucid.utxosByOutRef([
    {
      txHash: pelletRefTxHash.txHash,
      outputIndex: 0,
    },
  ]);
  const pelletValidator = pelletRef[0].scriptRef;
  if (!pelletValidator) {
    throw Error("Could not read pellet validator from ref UTxO");
  }
  const pelletAddressBech32 = lucid.utils.validatorToAddress(pelletValidator);

  const spacetimeRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./script-refs/spacetime-ref.json")
  );
  const spacetimeRef = await lucid.utxosByOutRef([
    {
      txHash: spacetimeRefTxHash.txHash,
      outputIndex: 0,
    },
  ]);
  const spacetimeValidator = spacetimeRef[0].scriptRef;
  if (!spacetimeValidator) {
    throw Error("Could not read pellet validator from ref UTxO");
  }
  const shipyardPolicyId = lucid.utils.mintingPolicyToId(spacetimeValidator);

  const pelletInfo = {
    fuel: fuel,
    pos_x: pos_x,
    pos_y: pos_y,
    shipyard_policy: shipyardPolicyId,
  };

  const pelletDatum = Data.to<PelletDatumT>(
    pelletInfo,
    PelletDatum as unknown as PelletDatumT
  );

  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);

  const tx = await lucid
    .newTx()
    .payToContract(
      pelletAddressBech32,
      { inline: pelletDatum },
      {
        [adminTokenUnit]: BigInt(1),
        lovelace: 2_000_000n,
      }
    )
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { createPellet };
