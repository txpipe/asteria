import { fuel_per_step } from "../../constants.ts";
import { moveShip } from "../../transactions/user/move-ship.ts";
import { printTxURL } from "../../utils.ts";

const delta_x = -7n;
const delta_y = 10n;
const ship_tx_hash =
  "85568f8fc35a103b6f5753a2634631477769f3bc9ae8ea7c60dd7f7c2f342cf8";

const txHash = await moveShip(fuel_per_step, delta_x, delta_y, ship_tx_hash);

printTxURL(txHash);
