import { admin_token } from "../../constants.ts";
import { consumePellets } from "../../transactions/admin/consume-pellets.ts";
import { printTxURL } from "../../utils.ts";

const pellets_tx_hash =
  "fb1a0a14864dc4ad49f53fe2e5416e2f9c8fac14734fe6ad4812b4d977237e11";
const pellets_tx_indexes = [0, 1, 2];

const txHash = await consumePellets(
  admin_token,
  pellets_tx_hash,
  pellets_tx_indexes
);
printTxURL(txHash);
