import { deployPellet } from "../../transactions/deploy/deploy-pellet.ts";
import { admin_token } from "../../constants.ts";

const txHash = await deployPellet(admin_token);

console.log(txHash);
