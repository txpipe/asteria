import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { moveShip } from "../transactions/move-ship.ts";

const fuel_per_step = 1n;
const delta_x = -5n;
const delta_y = -5n;
const ship_token_name = fromText("SHIP6");
const pilot_token_name = fromText("PILOT6");
const shipTxHash =
  "0a15b9bc5fab21137186120f487bd14d4bcef19747f53383281fcbbb99d2ce57";

const txHash = await moveShip(
  fuel_per_step,
  delta_x,
  delta_y,
  ship_token_name,
  pilot_token_name,
  shipTxHash
);

console.log(txHash);
