import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { deployAsteria } from "../../transactions/deploy/deploy-asteria.ts";
import { AssetClassT } from "../../types.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const ship_mint_lovelace_fee = 3000n;
const max_asteria_mining = 50n;

const txHash = await deployAsteria(
  admin_token,
  ship_mint_lovelace_fee,
  max_asteria_mining
);

console.log(txHash);
