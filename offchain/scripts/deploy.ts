import {
  SpendingValidator,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import plutusBlueprint from "../../onchain/src/plutus.json" with { type: "json" };

const deployValidator = plutusBlueprint.validators.find(
  ({ title }) => title === "deploy.spend"
);

if (!deployValidator) {
  throw new Error("Deploy validator indexed with 'deploy.spend' failed!");
}

const DEPLOY_SCRIPT: SpendingValidator["script"] =
  deployValidator.compiledCode;

function buildDeployValidator(): SpendingValidator {
  return {
    type: "PlutusV2",
    script: DEPLOY_SCRIPT,
  };
}

export { buildDeployValidator };
