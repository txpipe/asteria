import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { createShip } from "../transactions/create-ship.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const ship_mint_lovelace_fee = 3000n;
const initial_fuel = 15n;
const pos_x = 5n;
const pos_y = 5n;
const asteria_tx_hash =
  "ee451e2dbd7bdb9998eb469ba4833737769b2cfb771a33b79f70252193eebe68";
const asteria_tx_index = 0;

const txHash = await createShip(
  admin_token,
  ship_mint_lovelace_fee,
  initial_fuel,
  pos_x,
  pos_y,
  asteria_tx_hash,
  asteria_tx_index
);

console.log(txHash);
