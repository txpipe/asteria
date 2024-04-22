import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { createShip } from "../transactions/create-ship.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const ship_mint_lovelace_fee = 3000n;
const initial_fuel = 15n;
const pos_x = 20n;
const pos_y = -13n;

const txHash = await createShip(
  admin_token,
  ship_mint_lovelace_fee,
  initial_fuel,
  pos_x,
  pos_y
);

console.log(txHash);
