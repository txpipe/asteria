import {
  Data,
  toUnit,
  TxHash,
  Constr,
  UTxO,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";
import { fetchReferenceScript, lucidBase } from "../utils.ts";
import { AssetClassT } from "../types.ts";

async function consumeAsteria(
  admin_token: AssetClassT,
  asteria_tx_hash: TxHash,
  asteria_tx_index: number
): Promise<TxHash> {
  const lucid = await lucidBase();
  const seed = Deno.env.get("SEED");
  if (!seed) {
    throw Error("Unable to read wallet's seed from env");
  }
  lucid.selectWalletFromSeed(seed);

  const asteriaRefTxHash: { txHash: string } = JSON.parse(
    await Deno.readTextFile("./script-refs/asteria-ref.json")
  );
  const asteriaRef = await fetchReferenceScript(lucid, asteriaRefTxHash.txHash);

  const asteria: UTxO = (
    await lucid.utxosByOutRef([
      {
        txHash: asteria_tx_hash,
        outputIndex: asteria_tx_index,
      },
    ])
  )[0];
  if (!asteria.datum) {
    throw Error("Asteria datum not found");
  }

  const adminTokenUnit = toUnit(admin_token.policy, admin_token.name);

  const consumeRedeemer = Data.to(new Constr(2, []));
  const tx = await lucid
    .newTx()
    .readFrom([asteriaRef])
    .collectFrom([asteria], consumeRedeemer)
    .payToAddress(await lucid.wallet.address(), {
      [adminTokenUnit]: BigInt(1),
    })
    .complete();

  const signedTx = await tx.sign().complete();
  return signedTx.submit();
}

export { consumeAsteria };
