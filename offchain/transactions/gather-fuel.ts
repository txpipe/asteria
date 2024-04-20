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
  PelletDatum,
  PelletDatumT,
  ShipDatum,
  ShipDatumT,
} from "../types.ts";

async function gatherFuel(
  admin_token: AssetClassT,
  gather_amount: bigint,
  ship_token_name: string,
  pilot_token_name: string,
  shipTxHash: TxHash,
  pelletTxHash: TxHash
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
  const spacetimeAddressBech32 =
    lucid.utils.validatorToAddress(spacetimeValidator);

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

  const shipyardPolicyId = lucid.utils.mintingPolicyToId(spacetimeValidator);
  const shipTokenUnit = toUnit(shipyardPolicyId, ship_token_name);
  const pilotTokenUnit = toUnit(shipyardPolicyId, pilot_token_name);
  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);

  const ship: UTxO = (
    await lucid.utxosByOutRef([
      {
        txHash: shipTxHash,
        outputIndex: 0,
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
        txHash: pelletTxHash,
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

  const shipRedeemer = Data.to(new Constr(1, [new Constr(1, [gather_amount])]));
  const pelletRedeemer = Data.to(new Constr(0, [gather_amount]));
  const tx = await lucid
    .newTx()
    .collectFrom([ship], shipRedeemer)
    .collectFrom([pellet], pelletRedeemer)
    .readFrom([spacetimeRef[0], pelletRef[0]])
    .payToContract(
      spacetimeAddressBech32,
      { inline: shipOutputDatum },
      {
        [shipTokenUnit]: BigInt(1),
        lovelace: shipAda,
      }
    )
    .payToContract(
      pelletAddressBech32,
      { inline: pelletOutputDatum },
      {
        [adminTokenUnit]: BigInt(1),
        lovelace: pelletAda,
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
