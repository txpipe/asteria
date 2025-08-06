import { Data, fromText, Utxo } from "https://deno.land/x/lucid@0.20.5/mod.ts";
import {
  AsteriaTypesAssetClass,
  PelletPelletMint,
  PelletPelletSpend,
} from "../../../onchain/src/plutus.ts";
import { lucidBase } from "../src/utils.ts";
import { adminTokenName, chunkArray, getAdminPolicy, waitUtxosUpdate } from "./utils.ts";

const chunkLength = 25;
const deployTxHash = Deno.args[0];
console.log(`CHUNK LENGTH: ${chunkLength}`)

const lucid = await lucidBase();

const adminPolicy = await getAdminPolicy(lucid);
const adminPolicyId = adminPolicy.toHash();

const admin_token: AsteriaTypesAssetClass = {
  policy: adminPolicyId,
  name: adminTokenName,
};
const pelletValidator = new PelletPelletSpend(
  admin_token,
);
const pelletHash = lucid.newScript(pelletValidator).toHash();
const pelletAddress = lucid.newScript(pelletValidator).toAddress();

console.log("PELLET SCRIPT ADDRESS:", { pelletAddress, pelletHash });

//
// CONSUME PELLETS
//
console.log("\nCONSUMING PELLETS");

const pellets = await lucid.utxosAt(pelletAddress);

console.log("PELLETS NUMBER:", pellets.length);

const [pelletRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash,
  outputIndex: 2,
}]);
const fuelToken = pelletHash + fromText("FUEL");

const chunkedPellets: Utxo[][] = chunkArray(pellets, chunkLength);
for (const chunk of chunkedPellets) {
  const totalFuel = chunk.reduce(
    (sum, pellet) => sum + pellet.assets[fuelToken],
    0n
  );
  const initialWalletUTXOs = await lucid.wallet.getUtxos();

  const adminUTxO: Utxo = await lucid.wallet
    .getUtxos()
    .then((us) => us.filter((u) => u.assets[adminPolicyId + adminTokenName] >= 1n))
    .then((us) => us[0]);

  const tx = await lucid
      .newTx()
      .readFrom([pelletRef])
      .attachScript(adminPolicy.script)
      .collectFrom(
        chunk,
        Data.to("ConsumePellet", PelletPelletSpend.redeemer)
      )
      .mint(
        {
          [fuelToken]: -totalFuel,
        },
        Data.to("BurnFuel", PelletPelletMint.redeemer)
      )
      .mint(
        {
          [adminPolicyId + adminTokenName]: BigInt(-chunk.length),
        },
      )
      .collectFrom([adminUTxO])
      .commit();
  
  const signedTx = await tx.sign().commit();
  // console.log(signedTx.toString());
  const txHash = await signedTx.submit();

  console.log("\nTXHASH:", txHash);
  console.log("Waiting for transaction to be confirmed...");
  await lucid.awaitTx(txHash);
  await waitUtxosUpdate(lucid, initialWalletUTXOs);

  const remaining = await lucid.utxosAt(pelletAddress);
  console.log(`Consumed ${chunk.length} pellets (${remaining.length} remaining)`);
}
