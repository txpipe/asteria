import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { moveShip } from "../transactions/move-ship.ts";

const fuel_per_step = 1n;
const delta_x = 2n;
const delta_y = -3n;
const ship_token_name = fromText("SHIP4");
const pilot_token_name = fromText("PILOT4");

const txHash = await moveShip(
  fuel_per_step,
  delta_x,
  delta_y,
  ship_token_name,
  pilot_token_name
);

console.log(txHash);
