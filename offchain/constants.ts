import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "./types.ts";

const admin_token: AssetClassT = {
  policy: "f8ab3db3bc88f892d843e6d82ae78cee28c4eb073a6774390b880c7d",
  name: fromText("admin"),
};
const ship_mint_lovelace_fee = 3_000_000n;
const max_asteria_mining = 50n;
const max_moving_distance = 20n;
const max_ship_fuel = 100n;
const fuel_per_step = 1n;
const initial_fuel = 30n;
const min_asteria_distance = 10n;

export {
  admin_token,
  ship_mint_lovelace_fee,
  max_asteria_mining,
  max_moving_distance,
  max_ship_fuel,
  fuel_per_step,
  initial_fuel,
  min_asteria_distance,
};
