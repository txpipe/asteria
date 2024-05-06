import { admin_token, max_asteria_mining } from "../../constants.ts";
import { mineAsteria } from "../../transactions/user/mine-asteria.ts";
import { printTxURL } from "../../utils.ts";

const ship_tx_hash =
  "63213819a91009d48fda251fa5d735ba7fc17ff2d64558c167aa037919adcd05";

const txHash = await mineAsteria(admin_token, max_asteria_mining, ship_tx_hash);
printTxURL(txHash);
