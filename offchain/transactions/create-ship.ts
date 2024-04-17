import {
  Data,
  toUnit,
  getAddressDetails,
  TxHash,
  Constr,
  UTxO,
  fromText,
  MintingPolicy,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { buildAsteriaValidator } from "../scripts/asteria.ts";
import { lucidBase } from "../utils.ts";
import {
  AssetClassT,
  AsteriaDatum,
  AsteriaDatumT,
  ShipDatum,
  ShipDatumT,
} from "../types.ts";
import { buildShipyardMintingPolicy } from "../scripts/shipyard.ts";
import { buildSpacetimeValidator } from "../scripts/spacetime.ts";
import { buildPelletValidator } from "../scripts/pellet.ts";

async function createShip(
  admin_token: AssetClassT,
  ship_mint_lovelace_fee: bigint,
  max_asteria_mining: bigint,
  max_moving_distance: bigint,
  max_ship_fuel: bigint,
  fuel_per_step: bigint,
  initial_fuel: bigint,
  min_asteria_distance: bigint,
  pos_x: bigint,
  pos_y: bigint
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

  const asteriaValidator = buildAsteriaValidator(
    admin_token,
    ship_mint_lovelace_fee,
    max_asteria_mining
  );
  const asteriaAddressBech32 = lucid.utils.validatorToAddress(asteriaValidator);
  const asteriaScriptAddress =
    lucid.utils.paymentCredentialOf(asteriaAddressBech32).hash;

  const pelletValidator = buildPelletValidator(admin_token);
  const pelletAddressBech32 = lucid.utils.validatorToAddress(pelletValidator);
  const pelletScriptAddress =
    lucid.utils.paymentCredentialOf(pelletAddressBech32).hash;

  const spacetimeValidator = buildSpacetimeValidator(
    pelletScriptAddress,
    asteriaScriptAddress,
    admin_token,
    max_moving_distance,
    max_ship_fuel,
    fuel_per_step,
    initial_fuel,
    min_asteria_distance
  );
  const spacetimeAddressBech32 =
    lucid.utils.validatorToAddress(spacetimeValidator);
  const spacetimeAddressDetails = getAddressDetails(spacetimeAddressBech32);
  if (!spacetimeAddressDetails.paymentCredential) {
    throw Error("Unable to obtain Spacetime address credentials");
  }

  const shipyardMintingPolicy: MintingPolicy = buildShipyardMintingPolicy(
    pelletScriptAddress,
    asteriaScriptAddress,
    admin_token,
    max_moving_distance,
    max_ship_fuel,
    fuel_per_step,
    initial_fuel,
    min_asteria_distance
  );

  const shipyardPolicyId = lucid.utils.mintingPolicyToId(shipyardMintingPolicy);

  const asteria: UTxO = (await lucid.utxosAt(asteriaAddressBech32))[0];
  if (!asteria.datum) {
    throw Error("Asteria datum not found");
  }
  const asteriaInputAda = asteria.assets.lovelace;
  // const asteriaInputDatum: AsteriaDatumT = Data.from(asteria.datum);

  const asteriaInputDatum = Data.from<AsteriaDatumT>(
    asteria.datum as string,
    AsteriaDatum as unknown as AsteriaDatumT
  );

  const asteriaInfo = {
    ship_counter: asteriaInputDatum.ship_counter + 1n,
    shipyard_policy: shipyardPolicyId,
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
    .collectFrom([asteria], addNewShipRedeemer)
    .attachSpendingValidator(asteriaValidator)
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
    .attachMintingPolicy(shipyardMintingPolicy)
    .mintAssets(
      {
        [shipTokenUnit]: BigInt(1),
        [pilotTokenUnit]: BigInt(1),
      },
      mintRedeemer
    )
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { createShip };
