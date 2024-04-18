import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { distance, lucidBase, required_fuel } from "../utils.ts";
import { ShipDatum, ShipDatumT } from "../types.ts";

async function moveShip(
  fuel_per_step: bigint,
  delta_x: bigint,
  delta_y: bigint,
  ship_token_name: string,
  pilot_token_name: string
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

  const spacetimeRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./spacetime-ref.json")
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

  const shipyardPolicyId = lucid.utils.mintingPolicyToId(spacetimeValidator);
  const shipTokenUnit = toUnit(shipyardPolicyId, ship_token_name);
  const pilotTokenUnit = toUnit(shipyardPolicyId, pilot_token_name);

  const ship: UTxO = (await lucid.utxosAt(spacetimeAddressBech32))[0];
  if (!ship.datum) {
    throw Error("Ship datum not found");
  }
  const shipAda = ship.assets.lovelace;

  const shipInputDatum = Data.from<ShipDatumT>(
    ship.datum as string,
    ShipDatum as unknown as ShipDatumT
  );

  const moved_distance = distance(delta_x, delta_y);
  const spent_fuel = required_fuel(moved_distance, fuel_per_step);
  const shipInfo = {
    fuel: shipInputDatum.fuel - spent_fuel,
    pos_x: shipInputDatum.pos_x + delta_x,
    pos_y: shipInputDatum.pos_y + delta_y,
    shipyard_policy: shipInputDatum.shipyard_policy,
    ship_token_name: shipInputDatum.ship_token_name,
    pilot_token_name: shipInputDatum.pilot_token_name,
  };
  const shipOutputDatum = Data.to<ShipDatumT>(
    shipInfo,
    ShipDatum as unknown as ShipDatumT
  );

  const moveShipRedeemer = Data.to(
    new Constr(1, [new Constr(0, [delta_x, delta_y])])
  );
  const tx = await lucid
    .newTx()
    .collectFrom([ship], moveShipRedeemer)
    .readFrom(spacetimeRef)
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

export { moveShip };
