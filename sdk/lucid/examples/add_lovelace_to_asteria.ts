import { Data, Utxo } from "https://deno.land/x/lucid@0.20.5/mod.ts";
import { adminTokenName, getAdminPolicy, waitUtxosUpdate } from "./utils.ts"
import {
  AsteriaTypesAssetClass,
  PelletPelletSpend,
  AsteriaAsteriaSpend,
} from "../../../onchain/src/plutus.ts";
import { lucidBase } from "../src/utils.ts";
import deployParams from "./deploy_params.json" with { type: "json" };

const lucid = await lucidBase();
const deployTxHash = Deno.args[0];
const lovelace_to_add = Deno.args[1];

const adminPolicy = await getAdminPolicy(lucid);
const adminPolicyId = adminPolicy.toHash()
const admin_token: AsteriaTypesAssetClass = {
  policy: adminPolicyId,
  name: adminTokenName,
};

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
const [asteria] = await lucid.utxosAt(asteriaAddress);
const asteriaDatum = Data.from(asteria.datum, AsteriaAsteriaSpend.datum);

console.log("\nCONSUMING INITIAL ASTERIA UTXO:", asteria);

const [asteriaRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash,
  outputIndex: 0,
}]);

const initialWalletUTXOs = await lucid.wallet.getUtxos();

const adminUTxO: Utxo = await lucid.wallet
.getUtxos()
.then((us) => us.filter((u) => u.assets[adminPolicyId + adminTokenName] >= 1n))
.then((us) => us[0]);

const tx = await lucid
    .newTx()
    .readFrom([asteriaRef])
    .collectFrom(
        [asteria],
        Data.to("ConsumeAsteria", AsteriaAsteriaSpend.redeemer)
    )
    .collectFrom([adminUTxO])
    .payToContract(
        asteriaAddress,
        { Inline: Data.to(asteriaDatum, AsteriaAsteriaSpend.datum) },
        {
            [adminPolicy.toHash() + adminTokenName]: 1n,
            lovelace: asteria.assets.lovelace + BigInt(lovelace_to_add)
        }
    )
    .commit();

const signedTx = await tx.sign().commit();
// console.log(signedTx.toString());
const txHash = await signedTx.submit();

console.log("\nTXHASH:", txHash);
console.log("Waiting for transaction to be confirmed...");
await lucid.awaitTx(txHash);
await waitUtxosUpdate(lucid, initialWalletUTXOs);
