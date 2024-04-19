import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { gatherFuel } from "../transactions/gather-fuel.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const gather_amount = 20n;
const ship_token_name = fromText("SHIP5");
const pilot_token_name = fromText("PILOT5");
const shipTxHash =
  "bdae242f3dc8a4c3e1299a3b7631c1ba55d8858ddb4ab50760b99e8df7a0a4f1";
const pelletTxHash =
  "8e509be8d633f361e33c8fef0278d1e32fa196861798ff92d18f3b6b6ab05248";

const txHash = await gatherFuel(
  admin_token,
  gather_amount,
  ship_token_name,
  pilot_token_name,
  shipTxHash,
  pelletTxHash
);

console.log(txHash);
