import { Data, MintingPolicy, applyParamsToScript } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import plutusBlueprint from "../../onchain/src/plutus.json" with { type: "json" };
import { AikenAddress, AikenAddressT } from "../types.ts";

const shipyardPolicy = plutusBlueprint.validators.find(
  ({ title }) => title === "shipyard.mint"
);

if (!shipyardPolicy) {
  throw new Error(
    "Shipyard minting policy indexed with 'shipyard.mint' failed!"
  );
}

const MINTING_POLICY: MintingPolicy["script"] = shipyardPolicy.compiledCode;

const MintingPolicyParam = Data.Tuple([
  AikenAddress,
  AikenAddress,
  Data.Integer({ minimum: 0 }),
  Data.Integer({ minimum: 0 }),
]);

type MintingPolicyParamT = Data.Static<typeof MintingPolicyParam>;

function buildShipyardMintingPolicy(
  asteria_validator_address: AikenAddressT,
  spacetime_validator_address: AikenAddressT,
  initial_fuel: bigint,
  min_distance: bigint
): MintingPolicy {
  const appliedMintingPolicy = applyParamsToScript<MintingPolicyParamT>(
    MINTING_POLICY,
    [
      asteria_validator_address,
      spacetime_validator_address,
      initial_fuel,
      min_distance,
    ],
    MintingPolicyParam as unknown as MintingPolicyParamT
  );

  return {
    type: "PlutusV2",
    script: appliedMintingPolicy,
  };
}

export { buildShipyardMintingPolicy };
