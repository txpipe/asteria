import { Lucid, Blockfrost } from "https://deno.land/x/lucid@0.20.5/mod.ts";

const lucidBase = async (): Promise<Lucid> => {
  const lucid = new Lucid({
    provider: new Blockfrost(
      "https://cardano-preview.blockfrost.io/api/v0",
      Deno.env.get("BLOCKFROST_PROJECT_ID")
    )
  });
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);
  return lucid;
};

export { lucidBase };
