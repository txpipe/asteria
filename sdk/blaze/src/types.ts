import { Static, Type } from "@blaze-cardano/data";

// Internal Types

const ShipDatumSchema = Type.Object({
  pos_x: Type.BigInt(),
  pos_y: Type.BigInt(),
  ship_token_name: Type.String(),
  pilot_token_name: Type.String(),
  tx_latest_posix_time: Type.BigInt(),
}, { ctor: 0n });

type ShipDatum = Static<typeof ShipDatumSchema>;
const ShipDatum = ShipDatumSchema;

const AsteriaDatumSchema = Type.Object({
  ship_counter: Type.BigInt(),
  shipyard_policy: Type.String(),
}, { ctor: 0n });
type AsteriaDatum = Static<typeof AsteriaDatumSchema>;
const AsteriaDatum = AsteriaDatumSchema;

const PelletDatumSchema = Type.Object({
  pos_x: Type.BigInt(),
  pos_y: Type.BigInt(),
  shipyard_policy: Type.String(),
}, { ctor: 0n });

type PelletDatum = Static<typeof PelletDatumSchema>;
const PelletDatum = PelletDatumSchema;

const AsteriaScriptDatumSchema = Type.Object({
  admin_token: Type.Object({
    policy_id: Type.String(),
    asset_name: Type.String(),
  }, { ctor: 0n }),
  ship_mint_lovelace_fee: Type.BigInt(),
  max_asteria_mining: Type.BigInt(),
}, { ctor: 0n });

type AsteriaScriptDatum = Static<typeof AsteriaScriptDatumSchema>;
const AsteriaScriptDatum = AsteriaScriptDatumSchema;

const SpaceTimeScriptDatumSchema = Type.Object({
  pellet_validator_address: Type.String(),
  asteria_validator_address: Type.String(),
  admin_token: Type.Object({
    policy_id: Type.String(),
    asset_name: Type.String(),
  }, { ctor: 0n }),
  max_speed: Type.Object({
    distance: Type.BigInt(),
    time: Type.BigInt(),
  }, { ctor: 0n }),
  max_ship_fuel: Type.BigInt(),
  fuel_per_step: Type.BigInt(),
  initial_fuel: Type.BigInt(),
  min_asteria_distance: Type.BigInt(),
}, { ctor: 0n });
type SpaceTimeScriptDatum = Static<typeof SpaceTimeScriptDatumSchema>;
const SpaceTimeScriptDatum = SpaceTimeScriptDatumSchema;

const PelletScriptDatumSchema = Type.Object({
  admin_token: Type.Object({
    policy_id: Type.String(),
    asset_name: Type.String(),
  }, { ctor: 0n }),
}, { ctor: 0n });
type PelletScriptDatum = Static<typeof PelletScriptDatumSchema>;
const PelletScriptDatum = PelletScriptDatumSchema;

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
  PelletScriptDatum,
};

