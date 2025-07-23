import {
  AsteriaTypesAssetClass,
  AsteriaTypesSpeed
} from "../../../onchain/src/plutus.ts";

//
// CONFIGURATION

// tAXO token
const admin_token: AsteriaTypesAssetClass = {
    policy: "63f9a5fc96d4f87026e97af4569975016b50eef092a46859b61898e5",
    name: "0014df1041584f",
};
const adminToken = admin_token.policy + admin_token.name;


const ship_mint_lovelace_fee = 1_000_000n;
const max_asteria_mining = 50n;
const max_speed: AsteriaTypesSpeed = {
    distance: 1n,
    time: 30n * 1000n, // milliseconds (30 seconds)
};

const max_ship_fuel = 100n;
const fuel_per_step = 1n;
const initial_fuel = 30n;
const min_asteria_distance = 10n;

const deployTxHash = "dcb9e38dfe85706d966d094fc132d0857ab72d967112c9bbf0f4c75e45ae1f1b";

export {
  admin_token,
  adminToken,
  deployTxHash,
  ship_mint_lovelace_fee,
  max_asteria_mining,
  max_speed,
  max_ship_fuel,
  fuel_per_step,
  initial_fuel,
  min_asteria_distance
}