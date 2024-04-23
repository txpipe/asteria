import { deployAsteria } from "../../transactions/deploy/deploy-asteria.ts";
import {
  admin_token,
  max_asteria_mining,
  ship_mint_lovelace_fee,
} from "../../constants.ts";

const txHash = await deployAsteria(
  admin_token,
  ship_mint_lovelace_fee,
  max_asteria_mining
);

console.log(txHash);
