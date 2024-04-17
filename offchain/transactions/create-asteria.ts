import {
  Data,
  toUnit,
  getAddressDetails,
  TxHash,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { buildAsteriaValidator } from "../scripts/asteria.ts";
import { lucidBase } from "../utils.ts";
import { AssetClassT, AsteriaDatum, AsteriaDatumT } from "../types.ts";
import { buildShipyardMintingPolicy } from "../scripts/shipyard.ts";
import { buildSpacetimeValidator } from "../scripts/spacetime.ts";
import { buildPelletValidator } from "../scripts/pellet.ts";

async function createAsteria(
  admin_token: AssetClassT,
  ship_mint_lovelace_fee: bigint,
  max_asteria_mining: bigint,
  max_moving_distance: bigint,
  max_ship_fuel: bigint,
  fuel_per_step: bigint,
  initial_fuel: bigint,
  min_asteria_distance: bigint
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

  const shipyardMintingPolicy = buildShipyardMintingPolicy(
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

  const asteriaInfo = {
    ship_counter: 0n,
    shipyard_policy: shipyardPolicyId,
  };

  const asteriaDatum = Data.to<AsteriaDatumT>(
    asteriaInfo,
    AsteriaDatum as unknown as AsteriaDatumT
  );

  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);

  const tx = await lucid
    .newTx()
    .payToContract(
      asteriaAddressBech32,
      { inline: asteriaDatum },
      {
        [adminTokenUnit]: BigInt(1),
      }
    )
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { createAsteria };
