import { admin_token } from "../constants.ts";
import { createAsteria } from "../transactions/create-asteria.ts";
import { printTxURL } from "../utils.ts";

const txHash = await createAsteria(admin_token);

printTxURL(txHash);
