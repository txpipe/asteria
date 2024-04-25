import { deployPellet } from "../../transactions/deploy/deploy-pellet.ts";
import { admin_token } from "../../constants.ts";
import { printTxURL } from "../../utils.ts";

const txHash = await deployPellet(admin_token);

printTxURL(txHash);
