import { Data, Static } from "@blaze-cardano/sdk";

// Internal Types

const ShipDatumSchema = Data.Object({
  pos_x: Data.Integer(),
  pos_y: Data.Integer(),
  ship_token_name: Data.Bytes(),
  pilot_token_name: Data.Bytes(),
  tx_latest_posix_time: Data.Integer(),
});

type ShipDatum = Static<typeof ShipDatumSchema>;
const ShipDatum = ShipDatumSchema as unknown as ShipDatum;

const AsteriaDatumSchema = Data.Object({
  ship_counter: Data.Integer(),
  shipyard_policy: Data.Bytes(),
});
type AsteriaDatum = Static<typeof AsteriaDatumSchema>;
const AsteriaDatum = AsteriaDatumSchema as unknown as AsteriaDatum;

const PelletDatumSchema = Data.Object({
  pos_x: Data.Integer(),
  pos_y: Data.Integer(),
  shipyard_policy: Data.Bytes(),
});

type PelletDatum = Static<typeof PelletDatumSchema>;
const PelletDatum = PelletDatumSchema as unknown as PelletDatum;

const AsteriaScriptDatumSchema = Data.Object({
  admin_token: Data.Object({
    policy_id: Data.Bytes(),
    asset_name: Data.Bytes(),
  }),
  ship_mint_lovelace_fee: Data.Integer(),
  max_asteria_mining: Data.Integer(),
});

type AsteriaScriptDatum = Static<typeof AsteriaScriptDatumSchema>;
const AsteriaScriptDatum =
  AsteriaScriptDatumSchema as unknown as AsteriaScriptDatum;

const SpaceTimeScriptDatumSchema = Data.Object({
  pellet_validator_address: Data.Bytes(),
  asteria_validator_address: Data.Bytes(),
  admin_token: Data.Object({
    policy_id: Data.Bytes(),
    asset_name: Data.Bytes(),
  }),
  max_speed: Data.Object({
    distance: Data.Integer(),
    time: Data.Integer(),
  }),
  max_ship_fuel: Data.Integer(),
  fuel_per_step: Data.Integer(),
  initial_fuel: Data.Integer(),
  min_asteria_distance: Data.Integer(),
});
type SpaceTimeScriptDatum = Static<typeof SpaceTimeScriptDatumSchema>;
const SpaceTimeScriptDatum =
  SpaceTimeScriptDatumSchema as unknown as SpaceTimeScriptDatum;

const PelletScriptDatumSchema = Data.Object({
  admin_token: Data.Object({
    policy_id: Data.Bytes(),
    asset_name: Data.Bytes(),
  }),
});
type PelletScriptDatum = Static<typeof PelletScriptDatumSchema>;
const PelletScriptDatum =
  PelletScriptDatumSchema as unknown as PelletScriptDatum;

// External Types

type OutRef = {
  tx_hash: string;
  tx_index: bigint;
};

type GameIdentifier = {
  ship_utxo?: OutRef;
  pellet_utxo?: OutRef;
  spacetime_script_reference?: OutRef;
  pellet_script_reference?: OutRef;
  asteria_script_reference?: OutRef;
};

export {
  AsteriaDatum,
  AsteriaScriptDatum,
  GameIdentifier,
  OutRef,
  PelletDatum,
  ShipDatum,
  SpaceTimeScriptDatum,
  PelletScriptDatum
};
