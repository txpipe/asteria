import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { lucidBase } from "../utils.ts";
import {
  AssetClassT,
  AsteriaDatum,
  AsteriaDatumT,
  ShipDatum,
  ShipDatumT,
} from "../types.ts";

async function mineAsteria(
  admin_token: AssetClassT,
  ship_tx_hash: TxHash,
  asteria_tx_hash: TxHash,
  max_asteria_mining: bigint
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

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
    throw Error("Could not read spacetime validator from ref UTxO");
  }

  const asteriaRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./script-refs/asteria-ref.json")
  );
  const asteriaRef = await lucid.utxosByOutRef([
    {
      txHash: asteriaRefTxHash.txHash,
      outputIndex: 0,
    },
  ]);
  const asteriaValidator = asteriaRef[0].scriptRef;
  if (!asteriaValidator) {
    throw Error("Could not read asteria validator from ref UTxO");
  }
  const asteriaAddressBech32 = lucid.utils.validatorToAddress(asteriaValidator);

  const shipyardPolicyId = lucid.utils.mintingPolicyToId(spacetimeValidator);

  const ship: UTxO = (
    await lucid.utxosByOutRef([
      {
        txHash: ship_tx_hash,
        outputIndex: 0,
      },
    ])
  )[0];
  if (!ship.datum) {
    throw Error("Ship datum not found");
  }
  const shipInputDatum = Data.from<ShipDatumT>(
    ship.datum as string,
    ShipDatum as unknown as ShipDatumT
  );

  const asteria: UTxO = (
    await lucid.utxosByOutRef([
      {
        txHash: asteria_tx_hash,
        outputIndex: 1,
      },
    ])
  )[0];
  if (!asteria.datum) {
    throw Error("Asteria datum not found");
  }
  const rewards = asteria.assets.lovelace - 2_000_000n;
  const minedRewards = BigInt(
    (Number(rewards) * Number(max_asteria_mining)) / 100
  );

  const asteriaInputDatum = Data.from<AsteriaDatumT>(
    asteria.datum as string,
    AsteriaDatum as unknown as AsteriaDatumT
  );
  const asteriaInfo = {
    ship_counter: asteriaInputDatum.ship_counter,
    shipyard_policy: shipyardPolicyId,
  };
  const asteriaOutputDatum = Data.to<AsteriaDatumT>(
    asteriaInfo,
    AsteriaDatum as unknown as AsteriaDatumT
  );

  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);
  const shipTokenUnit = toUnit(
    shipyardPolicyId,
    shipInputDatum.ship_token_name
  );
  const pilotTokenUnit = toUnit(
    shipyardPolicyId,
    shipInputDatum.pilot_token_name
  );

  const shipRedeemer = Data.to(new Constr(1, [new Constr(2, [])]));
  const asteriaRedeemer = Data.to(new Constr(1, []));
  const burnRedeemer = Data.to(new Constr(1, []));
  const tx = await lucid
    .newTx()
    .mintAssets(
      {
        [shipTokenUnit]: BigInt(-1),
      },
      burnRedeemer
    )
    .collectFrom([ship], shipRedeemer)
    .collectFrom([asteria], asteriaRedeemer)
    .readFrom([spacetimeRef[0], asteriaRef[0], spacetimeRef[0]])
    .payToContract(
      asteriaAddressBech32,
      { inline: asteriaOutputDatum },
      {
        [adminTokenUnit]: BigInt(1),
        lovelace: rewards - minedRewards + 2_000_000n,
      }
    )
    .payToAddress(await lucid.wallet.address(), {
      [pilotTokenUnit]: BigInt(1),
      lovelace: 1_500_000n,
    })
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { mineAsteria };
