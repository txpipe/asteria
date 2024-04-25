import { admin_token } from "../constants.ts";
import { consumeAsteria } from "../transactions/consume-asteria.ts";
import { printTxURL } from "../utils.ts";

const asteria_tx_hash =
  "6603802230bef801697be03e3773ca10bfd17bebb0a8e6b49661353996d255a8";
const asteria_tx_index = 0;

const txHash = await consumeAsteria(
  admin_token,
  asteria_tx_hash,
  asteria_tx_index
);

printTxURL(txHash);
