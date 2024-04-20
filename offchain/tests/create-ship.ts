import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { createShip } from "../transactions/create-ship.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const ship_mint_lovelace_fee = 3_000_000n;
const initial_fuel = 30n;
const pos_x = 7n;
const pos_y = -10n;
const asteria_tx_hash =
  "2ad4ee7c7cd9156de39f33c5a1c31e701fae299366bf886c85bbb00ac84f210b";
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
