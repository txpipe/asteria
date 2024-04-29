import { admin_token } from "../constants.ts";
import { consumeAsteria } from "../transactions/consume-asteria.ts";
import { printTxURL } from "../utils.ts";

const asteria_tx_hash =
  "eadb2c22039e0371aecb006d0afde6631aa7ce7914a7929879cbbc20ddc1639a";

const txHash = await consumeAsteria(admin_token, asteria_tx_hash);

printTxURL(txHash);
