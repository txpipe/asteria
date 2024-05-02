import { admin_token } from "../../constants.ts";
import { createPellets } from "../../transactions/admin/create-pellets.ts";
import { printTxURL } from "../../utils.ts";

const params = [
  {
    fuel: 90n,
    pos_x: 12n,
    pos_y: -50n,
  },
  {
    fuel: 40n,
    pos_x: -7n,
    pos_y: 3n,
  },
  {
    fuel: 25n,
    pos_x: 20n,
    pos_y: 19n,
  },
];

const txHash = await createPellets(admin_token, params);
printTxURL(txHash);
