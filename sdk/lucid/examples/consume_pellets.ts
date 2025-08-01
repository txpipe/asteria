import { fromText, Data, Utxo } from "https://deno.land/x/lucid@0.20.5/mod.ts";
import {
  AsteriaTypesAssetClass,
  PelletPelletMint,
  PelletPelletSpend,
} from "../../../onchain/src/plutus.ts";
import { lucidBase } from "../src/utils.ts";
import { chunkArray, delay, haveSameUTxOs } from "./utils.ts";
import deployParams from "./deploy_params.json" with { type: "json" };

const deployTxHash = Deno.args[0];
const admin_token: AsteriaTypesAssetClass = {
  policy: deployParams.admin_token.policy,
  name: deployParams.admin_token.name,
};

const lucid = await lucidBase();

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

const chunkLength = 25;
const chunkedPellets: Utxo[][] = chunkArray(pellets, chunkLength);
for (const chunk of chunkedPellets) {
  const totalFuel = chunk.reduce(
    (sum, pellet) => sum + pellet.assets[fuelToken],
    0n
  );
  const initialWalletUTXOs = await lucid.wallet.getUtxos();

  const adminUTxO: Utxo = await lucid.wallet
    .getUtxos()
    .then((us) => us.filter((u) => u.assets[admin_token.policy + admin_token.name] >= 1n))
    .then((us) => us[0]);

  const tx = await lucid
      .newTx()
      .readFrom([pelletRef])
      .mint(
        {
        [fuelToken]: -totalFuel,
        },
        Data.to("BurnFuel", PelletPelletMint.redeemer)
      )
      .collectFrom(
        chunk,
        Data.to("ConsumePellet", PelletPelletSpend.redeemer)
      )
      .collectFrom([adminUTxO])
      .commit();
  
  const signedTx = await tx.sign().commit();
  // console.log(signedTx.toString());
  const txHash = await signedTx.submit();

  console.log("\nTXHASH:", txHash);
  console.log("Waiting for transaction to be confirmed...");
  await lucid.awaitTx(txHash);

  // This is a workaround to wait for the wallet UTxOs to be updated.
  // This way we avoid errors like trying to use inputs that were already spent.
  let wereUTxOsUpdated = false;
  while (!wereUTxOsUpdated) {
    console.log("Waiting for wallet UTXOs to be updated...");
    await delay(5000);
    const walletUTXOs = await lucid.wallet.getUtxos();
    wereUTxOsUpdated = !haveSameUTxOs(walletUTXOs, initialWalletUTXOs);
  }

  const remaining = await lucid.utxosAt(pelletAddress);
  console.log(`Consumed ${chunk.length} pellets (${remaining.length} remaining)`);
}
