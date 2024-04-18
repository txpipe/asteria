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

function writeJson(path: string, data: object): string {
  try {
    Deno.writeTextFileSync(path, JSON.stringify(data));
    return "Written to " + path;
  } catch (e) {
    return e.message;
  }
}

const abs = (n: bigint) => (n < 0n ? -n : n);

const distance = (delta_x: bigint, delta_y: bigint): bigint => {
  return abs(delta_x) + abs(delta_y);
};

const required_fuel = (distance: bigint, fuel_per_step: bigint): bigint => {
  return distance * fuel_per_step;
};

export { lucidBase, writeJson, distance, required_fuel };
