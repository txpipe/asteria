import {
  admin_token,
  initial_fuel,
  ship_mint_lovelace_fee,
} from "../constants.ts";
import { createShip } from "../transactions/create-ship.ts";
import { printTxURL } from "../utils.ts";

const pos_x = 7n;
const pos_y = -10n;
const asteria_tx_hash =
  "2ad4ee7c7cd9156de39f33c5a1c31e701fae299366bf886c85bbb00ac84f210b";
const asteria_tx_index = 0;

const txHash = await createShip(
  admin_token,
  ship_mint_lovelace_fee,
  initial_fuel,
  pos_x,
  pos_y,
  asteria_tx_hash,
  asteria_tx_index
);

printTxURL(txHash);
