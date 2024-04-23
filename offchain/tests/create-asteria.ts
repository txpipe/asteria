import { admin_token } from "../constants.ts";
import { createAsteria } from "../transactions/create-asteria.ts";

const txHash = await createAsteria(admin_token);

console.log(txHash);
