import {
  Data,
  toUnit,
  getAddressDetails,
  TxHash,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { buildAsteriaValidator } from "../scripts/asteria.ts";
import { lucidBase } from "../utils.ts";
import { AssetClassT, PelletDatum, PelletDatumT } from "../types.ts";
import { buildShipyardMintingPolicy } from "../scripts/shipyard.ts";
import { buildSpacetimeValidator } from "../scripts/spacetime.ts";
import { buildPelletValidator } from "../scripts/pellet.ts";

async function createPellet(
  admin_token: AssetClassT,
  ship_mint_lovelace_fee: bigint,
  max_asteria_mining: bigint,
  max_moving_distance: bigint,
  max_ship_fuel: bigint,
  fuel_per_step: bigint,
  initial_fuel: bigint,
  min_asteria_distance: bigint,
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
    asteriaAddress,
    pelletAddress,
    admin_token,
    max_moving_distance,
    max_ship_fuel,
    fuel_per_step,
    initial_fuel,
    min_asteria_distance
  );

  const shipyardTokenUnit = lucid.utils.mintingPolicyToId(
    shipyardMintingPolicy
  );

  const pelletInfo = {
    fuel: fuel,
    pos_x: pos_x,
    pos_y: pos_y,
    shipyard_policy: shipyardTokenUnit,
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
