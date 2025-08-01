import { Data, Utxo } from "https://deno.land/x/lucid@0.20.5/mod.ts";
import { chunkArray, delay, haveSameUTxOs } from "./utils.ts"
import {
  AsteriaTypesAssetClass,
  PelletPelletSpend,
  AsteriaAsteriaSpend,
} from "../../../onchain/src/plutus.ts";
import { lucidBase } from "../src/utils.ts";
import deployParams from "./deploy_params.json" with { type: "json" };

const deployTxHash = Deno.args[0];
const admin_token: AsteriaTypesAssetClass = {
  policy: deployParams.admin_token.policy,
  name: deployParams.admin_token.name,
};

const lucid = await lucidBase();

const ship_mint_lovelace_fee = BigInt(deployParams.ship_mint_lovelace_fee);
const max_asteria_mining = BigInt(deployParams.max_asteria_mining);
const initial_fuel = BigInt(deployParams.initial_fuel);
const min_asteria_distance = BigInt(deployParams.min_asteria_distance);

const pelletValidator = new PelletPelletSpend(
  admin_token,
);
const pelletHash = lucid.newScript(pelletValidator).toHash();

const asteriaValidator = new AsteriaAsteriaSpend(
  pelletHash,
  admin_token,
  ship_mint_lovelace_fee,
  max_asteria_mining,
  min_asteria_distance,
  initial_fuel,
);
const asteriaHash = lucid.newScript(asteriaValidator).toHash();
const asteriaAddress = lucid.newScript(asteriaValidator).toAddress();

console.log("ASTERIA SCRIPT ADDRESS:", { asteriaAddress, asteriaHash });

//
// CONSUME ASTERIA UTXOS
//
console.log("\nCONSUMING ASTERIA UTXOS");

const asterias = await lucid.utxosAt(asteriaAddress);

console.log("ASTERIA(S) NUMBER:", asterias.length);

const [asteriaRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash,
  outputIndex: 0,
}]);

const chunkLength = 10;
const chunkedAsterias: Utxo[][] = chunkArray(asterias, chunkLength);
for (const chunk of chunkedAsterias) {
  
  const initialWalletUTXOs = await lucid.wallet.getUtxos();

  const adminUTxO: Utxo = await lucid.wallet
    .getUtxos()
    .then((us) => us.filter((u) => u.assets[admin_token.policy + admin_token.name] >= 1n))
    .then((us) => us[0]);

  const tx = await lucid
      .newTx()
      .readFrom([asteriaRef])
      .collectFrom(
        chunk,
        Data.to("ConsumeAsteria", AsteriaAsteriaSpend.redeemer)
      )
      .collectFrom([adminUTxO])
      .commit();
  
  const signedTx = await tx.sign().commit();
  // console.log(signedTx.toString());
  const txHash = await signedTx.submit();

  console.log("\nTXHASH:", txHash);
  console.log("Waiting for transaction to be confirmed...");
  await lucid.awaitTx(txHash);


  // This is a workaround to wait for the wallet UTxOs to be updated after the deployment transaction.
  // This way we avoid errors like trying to use inputs that were already spent.
  let wereUTxOsUpdated = false;
  while (!wereUTxOsUpdated) {
    console.log("Waiting for wallet UTXOs to be updated...");
    await delay(5000);
    const walletUTXOs = await lucid.wallet.getUtxos();
    wereUTxOsUpdated = !haveSameUTxOs(walletUTXOs, initialWalletUTXOs);
  }
}
