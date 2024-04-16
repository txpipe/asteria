import { Data } from "https://deno.land/x/lucid@0.10.7/mod.ts";

// Aiken types
const AssetClass = Data.Object({
  policy: Data.Bytes({ maxLength: 28 }),
  name: Data.Bytes(),
});
type AssetClassT = Data.Static<typeof AssetClass>;

const AikenAddress = Data.Object({
  payment_credential: Data.Bytes(),
  stake_credential: Data.Bytes(),
});
type AikenAddressT = Data.Static<typeof AikenAddress>;

// Asteria
const AsteriaDatum = Data.Object({
  ship_counter: Data.Integer(),
  shipyard_policy: Data.Bytes({ maxLength: 28 }),
});
type AsteriaDatumT = Data.Static<typeof AsteriaDatum>;

// Pellet
const PelletDatum = Data.Object({
  fuel: Data.Integer(),
  pos_x: Data.Integer(),
  pos_y: Data.Integer(),
  shipyard_policy: Data.Bytes({ maxLength: 28 }),
});
type PelletDatumT = Data.Static<typeof PelletDatum>;

export { AssetClass, AsteriaDatum, AikenAddress };
export type { AssetClassT, AsteriaDatumT, PelletDatumT, AikenAddressT };
