import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { moveShip } from "../transactions/move-ship.ts";

const fuel_per_step = 1n;
const delta_x = 2n;
const delta_y = -3n;
const ship_token_name = fromText("SHIP0");
const pilot_token_name = fromText("PILOT0");
const shipTxHash =
  "ca30a841e582f284b7b71d39c2cbc8b9a7fca9476d921b6b9d97c0c7e31bf2bc";

const txHash = await moveShip(
  fuel_per_step,
  delta_x,
  delta_y,
  ship_token_name,
  pilot_token_name,
  shipTxHash
);

console.log(txHash);
