import { Data, SpendingValidator, applyParamsToScript } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import plutusBlueprint from "../../onchain/src/plutus.json" with { type: "json" };
import { AikenAddress, AikenAddressT, AssetClass, AssetClassT } from "../types.ts";

const spacetimeValidator = plutusBlueprint.validators.find(
  ({ title }) => title === "spacetime.spend"
);

if (!spacetimeValidator) {
  throw new Error("Spacetime validator indexed with 'spacetime.spend' failed!");
}

const SPACETIME_SCRIPT: SpendingValidator["script"] =
  spacetimeValidator.compiledCode;

const ValidatorParam = Data.Tuple([
  AikenAddress,
  AikenAddress,
  AssetClass,
  Data.Integer({ minimum: 0 }),
  Data.Integer({ minimum: 0 }),
  Data.Integer({ minimum: 0 }),
]);
type ValidatorParamT = Data.Static<typeof ValidatorParam>;

function buildSpacetimeValidator(
  pellet_validator_address: AikenAddressT,
  asteria_validator_address: AikenAddressT,
  admin_token: AssetClassT,
  max_distance: bigint,
  max_ship_fuel: bigint,
  fuel_per_step: bigint
): SpendingValidator {
  const appliedValidator = applyParamsToScript<ValidatorParamT>(
    SPACETIME_SCRIPT,
    [
      pellet_validator_address,
      asteria_validator_address,
      admin_token,
      max_distance,
      max_ship_fuel,
      fuel_per_step,
    ],
    ValidatorParam as unknown as ValidatorParamT
  );

  return {
    type: "PlutusV2",
    script: appliedValidator,
  };
}

export { buildSpacetimeValidator };
