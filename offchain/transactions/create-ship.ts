import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
  fromText,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { lucidBase } from "../utils.ts";
import {
  AssetClassT,
  AsteriaDatum,
  AsteriaDatumT,
  ShipDatum,
  ShipDatumT,
} from "../types.ts";

async function createShip(
  admin_token: AssetClassT,
  ship_mint_lovelace_fee: bigint,
  initial_fuel: bigint,
  pos_x: bigint,
  pos_y: bigint
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

  const asteriaRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./asteria-ref.json")
  );
  const asteriaRef = await lucid.utxosByOutRef([
    {
      txHash: asteriaRefTxHash.txHash,
      outputIndex: 0,
    },
  ]);
  const asteriaValidator = asteriaRef[0].scriptRef;
  if (!asteriaValidator) {
    throw Error("Could not read Asteria validator from ref UTxO");
  }
  const asteriaAddressBech32 = lucid.utils.validatorToAddress(asteriaValidator);

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
    throw Error("Could not read pellet validator from ref UTxO");
  }
  const shipyardPolicyId = lucid.utils.mintingPolicyToId(spacetimeValidator);
  const spacetimeAddressBech32 =
    lucid.utils.validatorToAddress(spacetimeValidator);

  const asteria: UTxO = (await lucid.utxosAt(asteriaAddressBech32))[0];
  if (!asteria.datum) {
    throw Error("Asteria datum not found");
  }
  const asteriaInputAda = asteria.assets.lovelace;

  const asteriaInputDatum = Data.from<AsteriaDatumT>(
    asteria.datum as string,
    AsteriaDatum as unknown as AsteriaDatumT
  );

  const asteriaInfo = {
    ship_counter: asteriaInputDatum.ship_counter + 1n,
    shipyard_policy: asteriaInputDatum.shipyard_policy,
  };
  const asteriaOutputDatum = Data.to<AsteriaDatumT>(
    asteriaInfo,
    AsteriaDatum as unknown as AsteriaDatumT
  );

  const shipTokenName = fromText("SHIP" + asteriaInputDatum.ship_counter);
  const pilotTokenName = fromText("PILOT" + asteriaInputDatum.ship_counter);
  const shipInfo = {
    fuel: initial_fuel,
    pos_x: pos_x,
    pos_y: pos_y,
    shipyard_policy: shipyardPolicyId,
    ship_token_name: shipTokenName,
    pilot_token_name: pilotTokenName,
  };
  const shipDatum = Data.to<ShipDatumT>(
    shipInfo,
    ShipDatum as unknown as ShipDatumT
  );

  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);
  const shipTokenUnit = toUnit(shipyardPolicyId, shipTokenName);
  const pilotTokenUnit = toUnit(shipyardPolicyId, pilotTokenName);

  const addNewShipRedeemer = Data.to(new Constr(0, []));
  const mintRedeemer = Data.to(new Constr(0, []));
  const tx = await lucid
    .newTx()
    .readFrom([asteriaRef[0], spacetimeRef[0]])
    .mintAssets(
      {
        [shipTokenUnit]: BigInt(1),
        [pilotTokenUnit]: BigInt(1),
      },
      mintRedeemer
    )
    .collectFrom([asteria], addNewShipRedeemer)
    .payToContract(
      spacetimeAddressBech32,
      { inline: shipDatum },
      {
        [shipTokenUnit]: BigInt(1),
      }
    )
    .payToContract(
      asteriaAddressBech32,
      { inline: asteriaOutputDatum },
      {
        [adminTokenUnit]: BigInt(1),
        lovelace: asteriaInputAda + ship_mint_lovelace_fee,
      }
    )
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { createShip };
