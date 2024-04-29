import { admin_token } from "../constants.ts";
import { consumePellet } from "../transactions/consume-pellet.ts";
import { printTxURL } from "../utils.ts";

const pellet_tx_hash =
  "65328c6dee12b38ec11049554ba91fa8da9b1f3471a849ef63141883cf2b27cf";

const txHash = await consumePellet(admin_token, pellet_tx_hash);
printTxURL(txHash);
