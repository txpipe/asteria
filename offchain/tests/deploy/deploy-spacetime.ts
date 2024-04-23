import { deploySpacetime } from "../../transactions/deploy/deploy-spacetime.ts";
import {
  admin_token,
  max_moving_distance,
  max_ship_fuel,
  fuel_per_step,
  initial_fuel,
  min_asteria_distance,
} from "../../constants.ts";

const txHash = await deploySpacetime(
  admin_token,
  max_moving_distance,
  max_ship_fuel,
  fuel_per_step,
  initial_fuel,
  min_asteria_distance
);

console.log(txHash);
