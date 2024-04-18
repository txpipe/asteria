import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { createPellet } from "../transactions/create-pellet.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const fuel = 40n;
const pos_x = 7n;
const pos_y = -10n;

const txHash = await createPellet(admin_token, fuel, pos_x, pos_y);

console.log(txHash);
