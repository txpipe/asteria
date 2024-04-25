import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { fetchReferenceScript, lucidBase } from "../utils.ts";
import { AssetClassT } from "../types.ts";

async function consumePellet(
  admin_token: AssetClassT,
  pellet_tx_hash: TxHash,
  pellet_tx_index: number,
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

  const asteriaRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./script-refs/pellet-ref.json"),
  );
  const asteriaRef = await fetchReferenceScript(lucid, asteriaRefTxHash.txHash);

  const pellet: UTxO = (
    await lucid.utxosByOutRef([
      {
        txHash: pellet_tx_hash,
        outputIndex: pellet_tx_index,
      },
    ])
  )[0];
  if (!pellet.datum) {
    throw Error("Pellet datum not found");
  }

  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);

  const consumeRedeemer = Data.to(new Constr(1, []));
  const tx = await lucid
    .newTx()
    .readFrom([asteriaRef])
    .collectFrom([pellet], consumeRedeemer)
    .payToAddress(await lucid.wallet.address(), {
      [adminTokenUnit]: BigInt(1),
    })
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { consumePellet };
