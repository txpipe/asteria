import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { fetchReferenceScript, lucidBase } from "../../../utils.ts";
import { AssetClassT } from "../../../types.ts";

async function consumePellets(
  admin_token: AssetClassT,
  pellets_tx_hash: TxHash,
  pellets_tx_indexes: number[]
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

  const pelletRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./script-refs/pellet-ref.json")
  );
  const pelletRef = await fetchReferenceScript(lucid, pelletRefTxHash.txHash);

  const pellets: UTxO[] = await lucid.utxosByOutRef(
    pellets_tx_indexes.map((i) => ({
      txHash: pellets_tx_hash,
      outputIndex: i,
    }))
  );

  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);
  const adminUTxO: UTxO = await lucid.wallet
    .getUtxos()
    .then((us) => us.filter((u) => u.assets[adminTokenUnit] >= 1n))
    .then((us) => us[0]);

  const consumeRedeemer = Data.to(new Constr(1, []));
  const tx = await lucid
    .newTx()
    .readFrom([pelletRef])
    .collectFrom(pellets, consumeRedeemer)
    .collectFrom([adminUTxO])
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { consumePellets };
