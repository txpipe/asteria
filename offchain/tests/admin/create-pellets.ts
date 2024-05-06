import { admin_token } from "../../constants.ts";
import { createPellets } from "../../transactions/admin/create-pellets.ts";
import { printTxURL } from "../../utils.ts";
import { parse } from "jsr:@std/csv";

const text = await Deno.readTextFile("tests/admin/pellets.csv");
const data = parse(text, {
  skipFirstRow: true,
  columns: ["fuel", "pos_x", "pos_y"],
});
const params: { fuel: bigint; pos_x: bigint; pos_y: bigint }[] = data.map(
  (p) => ({
    fuel: BigInt(p.fuel),
    pos_x: BigInt(p.pos_x),
    pos_y: BigInt(p.pos_y),
  })
);

const txHash = await createPellets(admin_token, params);
printTxURL(txHash);
