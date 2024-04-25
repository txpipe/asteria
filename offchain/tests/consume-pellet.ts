import { admin_token } from "../constants.ts";
import { consumePellet } from "../transactions/consume-pellet.ts";
import { printTxURL } from "../utils.ts";

const pellet_tx_hash =
  "27f120e6cabccb9968519b9bf252f0cf9e5d8b69a1e18910a5172c06ba0f35b2";
const pellet_tx_index = 0;

const txHash = await consumePellet(
  admin_token,
  pellet_tx_hash,
  pellet_tx_index,
);

printTxURL(txHash);
