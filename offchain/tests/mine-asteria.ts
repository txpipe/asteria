import { admin_token } from "../constants.ts";
import { mineAsteria } from "../transactions/mine-asteria.ts";

const ship_tx_hash =
  "40930f706ba2bb29be56326a3171ffa17e2d7f4e1d9cdeac347e05f3559efcd8";
const asteria_tx_hash =
  "6ca378639a51b1283ec2c84deb772f62bff59603eca230aeb711fedee8389d69";
const max_asteria_mining = 50n;

const txHash = await mineAsteria(
  admin_token,
  ship_tx_hash,
  asteria_tx_hash,
  max_asteria_mining
);

console.log(txHash);
