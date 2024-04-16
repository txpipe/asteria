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
  max_distance: bigint,
  max_ship_fuel: bigint,
  fuel_per_step: bigint,
  initial_fuel: bigint,
  min_distance: bigint
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
  const asteriaAddressDetails = getAddressDetails(asteriaAddressBech32);
  if (!asteriaAddressDetails.paymentCredential) {
    throw Error("Unable to obtain Asteria address credentials");
  }
  const asteriaAddress = {
    payment_credential: asteriaAddressDetails.paymentCredential.hash,
    stake_credential: asteriaAddressDetails.stakeCredential?.hash || "",
  };

  const pelletValidator = buildPelletValidator(admin_token);
  const pelletAddressBech32 = lucid.utils.validatorToAddress(pelletValidator);
  const pelletAddressDetails = getAddressDetails(pelletAddressBech32);
  if (!pelletAddressDetails.paymentCredential) {
    throw Error("Unable to obtain Pellet address credentials");
  }
  const pelletAddress = {
    payment_credential: pelletAddressDetails.paymentCredential.hash,
    stake_credential: pelletAddressDetails.stakeCredential?.hash || "",
  };

  const spacetimeValidator = buildSpacetimeValidator(
    asteriaAddress,
    pelletAddress,
    admin_token,
    max_distance,
    max_ship_fuel,
    fuel_per_step
  );
  const spacetimeAddressBech32 =
    lucid.utils.validatorToAddress(spacetimeValidator);
  const spacetimeAddressDetails = getAddressDetails(spacetimeAddressBech32);
  if (!spacetimeAddressDetails.paymentCredential) {
    throw Error("Unable to obtain Spacetime address credentials");
  }
  const spacetimeAddress = {
    payment_credential: spacetimeAddressDetails.paymentCredential.hash,
    stake_credential: spacetimeAddressDetails.stakeCredential?.hash || "",
  };

  const shipyardMintingPolicy = buildShipyardMintingPolicy(
    asteriaAddress,
    spacetimeAddress,
    initial_fuel,
    min_distance
  );

  const shipyardTokenUnit = lucid.utils.mintingPolicyToId(
    shipyardMintingPolicy
  );

  const asteriaInfo = {
    ship_counter: 0n,
    shipyard_policy: shipyardTokenUnit,
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
        lovelace: 2_000_000n,
      }
    )
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { createAsteria };
