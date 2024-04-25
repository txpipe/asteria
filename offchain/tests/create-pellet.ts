import { admin_token } from "../constants.ts";
import { createPellet } from "../transactions/create-pellet.ts";
import { printTxURL } from "../utils.ts";

const fuel = 90n;
const pos_x = 12n;
const pos_y = -50n;
const txHash = await createPellet(admin_token, fuel, pos_x, pos_y);

printTxURL(txHash);
