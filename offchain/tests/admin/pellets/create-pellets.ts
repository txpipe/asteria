import { admin_token } from "../../../constants.ts";
import { createPellets } from "../../../transactions/admin/pellets/create-pellets.ts";
import { readPelletsCSV } from "../../../transactions/admin/pellets/utils.ts";
import { printTxURL } from "../../../utils.ts";

const params = await readPelletsCSV("tests/admin/pellets.csv");
const txHash = await createPellets(admin_token, params);
printTxURL(txHash);
