import { admin_token } from "../constants.ts";
import { gatherFuel } from "../transactions/gather-fuel.ts";

const gather_amount = 20n;
const ship_tx_hash =
  "6ca378639a51b1283ec2c84deb772f62bff59603eca230aeb711fedee8389d69";
const pellet_tx_hash =
  "b1d5dedc6c9ba333d8eab4c9f05edda4563fc313fc9b124393ec3b64e3676fb0";

const txHash = await gatherFuel(
  admin_token,
  gather_amount,
  ship_tx_hash,
  pellet_tx_hash
);

console.log(txHash);
