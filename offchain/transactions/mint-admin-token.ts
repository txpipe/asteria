import { lucidBase } from "../utils.ts";
import {
  toUnit,
  fromText,
  Assets,
} from "https://deno.land/x/lucid@0.10.7/mod.ts";

const lucid = await lucidBase();
const seed = Deno.env.get("SEED");
if (!seed) {
  throw Error("Unable to read wallet's seed from env");
}
lucid.selectWalletFromSeed(seed);
const address = await lucid.wallet.address();

const { paymentCredential } = lucid.utils.getAddressDetails(address);

const beforeSlot = lucid.currentSlot() + 60;
const mintingPolicy = lucid.utils.nativeScriptFromJson({
  type: "all",
  scripts: [
    { type: "sig", keyHash: paymentCredential?.hash },
    {
      type: "before",
      slot: beforeSlot,
    },
  ],
});

const policyId = lucid.utils.mintingPolicyToId(mintingPolicy);

const policyUnit = toUnit(policyId, fromText("admin"));
const policyAsset: Assets = { [policyUnit]: 10000n };

const tx = await lucid
  .newTx()
  .mintAssets(policyAsset)
  .attachMintingPolicy(mintingPolicy)
  .payToAddress(address, policyAsset)
  .validTo(lucid.utils.slotToUnixTime(beforeSlot))
  .complete();

const signedTx = await lucid.fromTx(tx.toString()).sign().complete();
const txid = await signedTx.submit();
const cExplorerTxURL = "https://preview.cexplorer.io/tx/";
console.log(`${cExplorerTxURL}${txid}`);
