import { fromText } from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { AssetClassT } from "../types.ts";
import { createShip } from "../transactions/create-ship.ts";

const admin_token: AssetClassT = {
  policy: "0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005",
  name: fromText("tokenA"),
};

const txHash = await createShip(
  admin_token,
  3_000n,
  50n,
  20n,
  100n,
  1n,
  15n,
  10n,
  7n,
  20n
);

console.log(txHash);
