import {
  admin_token,
  initial_fuel,
  ship_mint_lovelace_fee,
} from "../../constants.ts";
import { createShip } from "../../transactions/user/create-ship.ts";
import { printTxURL } from "../../utils.ts";

const pos_x = -7n;
const pos_y = 3n;
const asteria_tx_hash =
  "8884b2ccbb0d2cd5192459609f775f5b4e5681f5de8d6a4b6f9fc109ea601605";
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
