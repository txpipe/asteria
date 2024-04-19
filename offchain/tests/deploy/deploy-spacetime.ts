import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { deploySpacetime } from "../../transactions/deploy/deploy-spacetime.ts";
import { AssetClassT } from "../../types.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const max_moving_distance = 20n;
const max_ship_fuel = 100n;
const fuel_per_step = 1n;
const initial_fuel = 15n;
const min_asteria_distance = 10n;

const txHash = await deploySpacetime(
  admin_token,
  max_moving_distance,
  max_ship_fuel,
  fuel_per_step,
  initial_fuel,
  min_asteria_distance
);

console.log(txHash);
