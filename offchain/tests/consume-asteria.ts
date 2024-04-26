import { admin_token } from "../constants.ts";
import { consumeAsteria } from "../transactions/consume-asteria.ts";
import { printTxURL } from "../utils.ts";

const asteria_tx_hash =
  "80d24d906251c7a2e6cfdee77eab0ef0c57498da890391df4428a6a6b9992c7c";
const asteria_tx_index = 0;

const txHash = await consumeAsteria(
  admin_token,
  asteria_tx_hash,
  asteria_tx_index,
);

printTxURL(txHash);
