import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "./types.ts";

const admin_token: AssetClassT = {
  policy: "516238dd0a79bac4bebe041c44bad8bf880d74720733d2fc0d255d28",
  name: fromText("asteriaAdmin"),
};
const ship_mint_lovelace_fee = 20_000_000n;
const max_asteria_mining = 100n;
const max_moving_distance = 5n;
const max_ship_fuel = 30n;
const fuel_per_step = 1n;
const initial_fuel = max_ship_fuel;
const min_asteria_distance = 50n;

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
