import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
  Script,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { fetchReferenceScript, lucidBase } from "../utils.ts";
import {
  AssetClassT,
  PelletDatum,
  PelletDatumT,
  ShipDatum,
  ShipDatumT,
} from "../types.ts";

async function gatherFuel(
  admin_token: AssetClassT,
  gather_amount: bigint,
  ship_tx_hash: TxHash,
  pellet_tx_hash: TxHash
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
  const spacetimeRef = await fetchReferenceScript(
    lucid,
    spacetimeRefTxHash.txHash
  );
  const spacetimeValidator = spacetimeRef.scriptRef as Script;
  const spacetimeAddressBech32 =
    lucid.utils.validatorToAddress(spacetimeValidator);
  const shipyardPolicyId = lucid.utils.mintingPolicyToId(spacetimeValidator);

  const pelletRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./script-refs/pellet-ref.json")
  );
  const pelletRef = await fetchReferenceScript(lucid, pelletRefTxHash.txHash);
  const pelletValidator = pelletRef.scriptRef as Script;
  const pelletAddressBech32 = lucid.utils.validatorToAddress(pelletValidator);

  const ship: UTxO = (
    await lucid.utxosByOutRef([
      {
        txHash: ship_tx_hash,
        outputIndex: 1,
      },
    ])
  )[0];
  if (!ship.datum) {
    throw Error("Ship datum not found");
  }
  const shipAda = ship.assets.lovelace;

  const pellet: UTxO = (
    await lucid.utxosByOutRef([
      {
        txHash: pellet_tx_hash,
        outputIndex: 0,
      },
    ])
  )[0];
  if (!ship.datum) {
    throw Error("Ship datum not found");
  }
  const pelletAda = pellet.assets.lovelace;

  const shipInputDatum = Data.from<ShipDatumT>(
    ship.datum as string,
    ShipDatum as unknown as ShipDatumT
  );
  const shipInfo = {
    fuel: shipInputDatum.fuel + gather_amount,
    pos_x: shipInputDatum.pos_x,
    pos_y: shipInputDatum.pos_y,
    ship_token_name: shipInputDatum.ship_token_name,
    pilot_token_name: shipInputDatum.pilot_token_name,
  };
  const shipOutputDatum = Data.to<ShipDatumT>(
    shipInfo,
    ShipDatum as unknown as ShipDatumT
  );

  const pelletInputDatum = Data.from<PelletDatumT>(
    pellet.datum as string,
    PelletDatum as unknown as PelletDatumT
  );
  const pelletInfo = {
    fuel: pelletInputDatum.fuel - gather_amount,
    pos_x: pelletInputDatum.pos_x,
    pos_y: pelletInputDatum.pos_y,
    shipyard_policy: shipyardPolicyId,
  };
  const pelletOutputDatum = Data.to<PelletDatumT>(
    pelletInfo,
    PelletDatum as unknown as PelletDatumT
  );

  const shipTokenUnit = toUnit(
    shipyardPolicyId,
    shipInputDatum.ship_token_name
  );
  const pilotTokenUnit = toUnit(
    shipyardPolicyId,
    shipInputDatum.pilot_token_name
  );
  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);

  const shipRedeemer = Data.to(new Constr(1, [new Constr(1, [gather_amount])]));
  const pelletRedeemer = Data.to(new Constr(0, [gather_amount]));
  const tx = await lucid
    .newTx()
    .collectFrom([ship], shipRedeemer)
    .collectFrom([pellet], pelletRedeemer)
    .readFrom([spacetimeRef, pelletRef])
    .payToContract(
      pelletAddressBech32,
      { inline: pelletOutputDatum },
      {
        [adminTokenUnit]: BigInt(1),
        lovelace: pelletAda,
      }
    )
    .payToContract(
      spacetimeAddressBech32,
      { inline: shipOutputDatum },
      {
        [shipTokenUnit]: BigInt(1),
        lovelace: shipAda,
      }
    )
    .payToAddress(await lucid.wallet.address(), {
      [pilotTokenUnit]: BigInt(1),
    })
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { gatherFuel };
