import { admin_token } from "../../constants.ts";
import { gatherFuel } from "../../transactions/user/gather-fuel.ts";
import { printTxURL } from "../../utils.ts";

const gather_amount = 20n;
const ship_tx_hash =
  "f1079755f32839c7c55796335e6835a0aafa8ce9b3e15fed287e0d971826881c";
const pellet_tx_hash =
  "f7f8f8298876cabb81357c1d7e89e2e01bf8956a566063f12ceee7b6901d0334";
const pellet_tx_index = 1;

const txHash = await gatherFuel(
  admin_token,
  gather_amount,
  ship_tx_hash,
  pellet_tx_hash,
  pellet_tx_index
);

printTxURL(txHash);
