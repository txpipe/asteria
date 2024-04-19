import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { mineAsteria } from "../transactions/mine-asteria.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const ship_token_name = fromText("SHIP6");
const pilot_token_name = fromText("PILOT6");
const shipTxHash =
  "1be603c259493cd332d22bb8f36787cd90e740c1bf224eea6fdf46f6e129e7ce";
const asteriaTxHash =
  "3b223f93afe6453005c773f35a42dc5018bbb6a8c19cadc754c2ae499e2ffec6";

const txHash = await mineAsteria(
  admin_token,
  ship_token_name,
  pilot_token_name,
  shipTxHash,
  asteriaTxHash
);

console.log(txHash);
