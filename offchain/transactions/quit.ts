import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { lucidBase } from "../utils.ts";
import { ShipDatum, ShipDatumT } from "../types.ts";

async function quit(ship_tx_hash: TxHash): Promise<TxHash> {
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
  const shipDatum = Data.from<ShipDatumT>(
    ship.datum as string,
    ShipDatum as unknown as ShipDatumT
  );

  const shipyardPolicyId = lucid.utils.mintingPolicyToId(spacetimeValidator);
  const shipTokenUnit = toUnit(shipyardPolicyId, shipDatum.ship_token_name);
  const pilotTokenUnit = toUnit(shipyardPolicyId, shipDatum.pilot_token_name);

  const quitRedeemer = Data.to(new Constr(1, [new Constr(3, [])]));
  const burnRedeemer = Data.to(new Constr(1, []));
  const tx = await lucid
    .newTx()
    .mintAssets(
      {
        [shipTokenUnit]: BigInt(-1),
      },
      burnRedeemer
    )
    .collectFrom([ship], quitRedeemer)
    .readFrom(spacetimeRef)
    .payToAddress(await lucid.wallet.address(), {
      [pilotTokenUnit]: BigInt(1),
    })
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { quit };
