import { Data } from "https://deno.land/x/lucid@0.10.7/mod.ts";

const AssetClass = Data.Object({
  policy: Data.Bytes({ maxLength: 28 }),
  name: Data.Bytes(),
});
type AssetClassT = Data.Static<typeof AssetClass>;

const AsteriaDatum = Data.Object({
  ship_counter: Data.Integer(),
  shipyard_policy: Data.Bytes({ maxLength: 28 }),
});
type AsteriaDatumT = Data.Static<typeof AsteriaDatum>;

const PelletDatum = Data.Object({
  fuel: Data.Integer(),
  pos_x: Data.Integer(),
  pos_y: Data.Integer(),
  shipyard_policy: Data.Bytes({ maxLength: 28 }),
});
type PelletDatumT = Data.Static<typeof PelletDatum>;

const ShipDatum = Data.Object({
  fuel: Data.Integer(),
  pos_x: Data.Integer(),
  pos_y: Data.Integer(),
  ship_token_name: Data.Bytes(),
  pilot_token_name: Data.Bytes(),
});
type ShipDatumT = Data.Static<typeof ShipDatum>;

const ShipRedeemerSchema = Data.Enum([
  Data.Object({
    MoveShip: Data.Object({
      delta_x: Data.Integer(),
      delta_y: Data.Integer(),
    }),
  }),
  Data.Object({
    GatherFuel: Data.Object({
      amount: Data.Integer(),
    }),
  }),
  Data.Literal("MineAsteria"),
  Data.Literal("Quit"),
]);

type ShipRedeemerT = Data.Static<typeof ShipRedeemerSchema>;

// deno-lint-ignore no-namespace
namespace ShipRedeemer {
  export const MoveShip = (delta_x: bigint, delta_y: bigint) =>
    Data.to<ShipRedeemerT>(
      {
        MoveShip: {
          delta_x,
          delta_y,
        },
      },
      ShipRedeemerSchema as unknown as ShipRedeemerT
    );
  export const GatherFuel = (amount: bigint) =>
    Data.to<ShipRedeemerT>(
      {
        GatherFuel: {
          amount,
        },
      },
      ShipRedeemerSchema as unknown as ShipRedeemerT
    );
  export const MineAsteria = () =>
    Data.to<ShipRedeemerT>(
      "MineAsteria",
      ShipRedeemerSchema as unknown as ShipRedeemerT
    );
  export const Quit = () =>
    Data.to<ShipRedeemerT>(
      "Quit",
      ShipRedeemerSchema as unknown as ShipRedeemerT
    );
}

export { AssetClass, AsteriaDatum, PelletDatum, ShipDatum, ShipRedeemer };
export type { AssetClassT, AsteriaDatumT, PelletDatumT, ShipDatumT };
