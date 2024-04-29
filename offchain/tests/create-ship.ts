import {
  admin_token,
  initial_fuel,
  ship_mint_lovelace_fee,
} from "../constants.ts";
import { createShip } from "../transactions/create-ship.ts";
import { printTxURL } from "../utils.ts";

const pos_x = -7n;
const pos_y = 3n;
const asteria_tx_hash =
  "f76bb8c67e99a5fc9e5dff56b5534a1e47e2ca286361ab625d5ff5a21aa13140";

const txHash = await createShip(
  admin_token,
  ship_mint_lovelace_fee,
  initial_fuel,
  pos_x,
  pos_y,
  asteria_tx_hash
);

printTxURL(txHash);
