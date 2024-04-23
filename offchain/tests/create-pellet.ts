import { admin_token } from "../constants.ts";
import { createPellet } from "../transactions/create-pellet.ts";

const fuel = 40n;
const pos_x = 7n;
const pos_y = -10n;
const txHash = await createPellet(admin_token, fuel, pos_x, pos_y);

console.log(txHash);
