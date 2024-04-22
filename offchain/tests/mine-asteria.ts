import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { mineAsteria } from "../transactions/mine-asteria.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const ship_tx_hash =
  "40930f706ba2bb29be56326a3171ffa17e2d7f4e1d9cdeac347e05f3559efcd8";
const asteria_tx_hash =
  "6ca378639a51b1283ec2c84deb772f62bff59603eca230aeb711fedee8389d69";
const max_asteria_mining = 50n;

const txHash = await mineAsteria(
  admin_token,
  ship_tx_hash,
  asteria_tx_hash,
  max_asteria_mining
);

console.log(txHash);
