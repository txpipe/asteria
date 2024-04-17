import { Address, Data, MintingPolicy, applyParamsToScript } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import plutusBlueprint from "../../onchain/src/plutus.json" with { type: "json" };
import { AssetClass, AssetClassT } from "../types.ts";

const shipyardPolicy = plutusBlueprint.validators.find(
  ({ title }) => title === "spacetime.mint"
);

if (!shipyardPolicy) {
  throw new Error(
    "Shipyard minting policy indexed with 'spacetime.mint' failed!"
  );
}

const MINTING_POLICY: MintingPolicy["script"] = shipyardPolicy.compiledCode;

const MintingPolicyParam = Data.Tuple([
  Data.Bytes(),
  Data.Bytes(),
  AssetClass,
  Data.Integer({ minimum: 0 }),
  Data.Integer({ minimum: 0 }),
  Data.Integer({ minimum: 0 }),
  Data.Integer({ minimum: 0 }),
  Data.Integer({ minimum: 0 }),
]);

type MintingPolicyParamT = Data.Static<typeof MintingPolicyParam>;

function buildShipyardMintingPolicy(
  pellet_validator_address: Address,
  asteria_validator_address: Address,
  admin_token: AssetClassT,
  max_moving_distance: bigint,
  max_ship_fuel: bigint,
  fuel_per_step: bigint,
  initial_fuel: bigint,
  min_asteria_distance: bigint,
): MintingPolicy {
  const appliedMintingPolicy = applyParamsToScript<MintingPolicyParamT>(
    MINTING_POLICY,
    [
      pellet_validator_address,
      asteria_validator_address,
      admin_token,
      max_moving_distance,
      max_ship_fuel,
      fuel_per_step,
      initial_fuel,
      min_asteria_distance
    ],
    MintingPolicyParam as unknown as MintingPolicyParamT
  );

  return {
    type: "PlutusV2",
    script: appliedMintingPolicy,
  };
}

export { buildShipyardMintingPolicy };
