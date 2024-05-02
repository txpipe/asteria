import { admin_token, max_asteria_mining } from "../constants.ts";
import { mineAsteria } from "../transactions/mine-asteria.ts";
import { printTxURL } from "../utils.ts";

const ship_tx_hash =
  "a528f7e89227b16d769e46b81fae20ba223b3f8fd23d82bb61aa6298f53eb5be";
const asteria_tx_hash =
  "aff7cd18d9bf623cdf94544837a450323db2298913b7f6d353e51d9ac109a72a";
const asteria_tx_index = 1;

const txHash = await mineAsteria(
  admin_token,
  max_asteria_mining,
  ship_tx_hash,
  asteria_tx_hash,
  asteria_tx_index
);

printTxURL(txHash);
