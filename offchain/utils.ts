import { Lucid, Blockfrost } from "https://deno.land/x/lucid@0.10.7/mod.ts";

const lucidBase = async (): Promise<Lucid> => {
  const lucid = await Lucid.new(
    new Blockfrost(
      "https://cardano-preprod.blockfrost.io/api/v0",
      Deno.env.get("BLOCKFROST_PROJECT_ID")
    ),
    "Preprod"
  );
  return lucid;
};

export { lucidBase };
