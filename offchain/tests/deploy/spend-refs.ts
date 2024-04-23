import { spendRefUTxOs } from "../../transactions/deploy/spend-refs.ts";
import { admin_token } from "../../constants.ts";

const txHash = await spendRefUTxOs(admin_token);

console.log(txHash);
