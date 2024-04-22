import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { gatherFuel } from "../transactions/gather-fuel.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};
const gather_amount = 20n;
const ship_tx_hash =
  "6ca378639a51b1283ec2c84deb772f62bff59603eca230aeb711fedee8389d69";
const pellet_tx_hash =
  "b1d5dedc6c9ba333d8eab4c9f05edda4563fc313fc9b124393ec3b64e3676fb0";

const txHash = await gatherFuel(
  admin_token,
  gather_amount,
  ship_tx_hash,
  pellet_tx_hash
);

console.log(txHash);
