import { fromText, Data, Utxo } from "https://deno.land/x/lucid@0.20.5/mod.ts";
import {
  AsteriaAsteriaSpend,
  AsteriaTypesAssetClass,
  AsteriaTypesSpeed,
  DeployDeploySpend,
  PelletPelletMint,
  PelletPelletSpend,
  SpacetimeSpacetimeSpend,
} from "../../../onchain/src/plutus.ts";
import { lucidBase } from "../src/utils.ts";
import { chunkArray, delay, haveSameUTxOs } from "./utils.ts";
import { readPelletsCSV } from "../../../offchain/tests/admin/pellets/utils.ts";
import deployParams from "./deploy_params.json" with { type: "json" };

console.log("DEPLOYING ASTERIA");

//
// CONFIGURATION
//
const admin_token: AsteriaTypesAssetClass = {
  policy: deployParams.admin_token.policy,
  name: deployParams.admin_token.name,
};
const ship_mint_lovelace_fee = BigInt(deployParams.ship_mint_lovelace_fee);
const max_asteria_mining = BigInt(deployParams.max_asteria_mining);
const max_speed: AsteriaTypesSpeed = {
  distance: BigInt(deployParams.max_speed.distance),
  time: BigInt(deployParams.max_speed.time),
};
const max_ship_fuel = BigInt(deployParams.max_ship_fuel);
const fuel_per_step = BigInt(deployParams.fuel_per_step);
const initial_fuel = BigInt(deployParams.initial_fuel);
const min_asteria_distance = BigInt(deployParams.min_asteria_distance);

//
// VALIDATORS INSTANTIATION
//
const lucid = await lucidBase();
const initialWalletUTXOs = await lucid.wallet.getUtxos();

const deployValidator = new DeployDeploySpend(
  admin_token,
);
const deployAddress = lucid.newScript(deployValidator).toAddress();

const pelletValidator = new PelletPelletSpend(
  admin_token,
);
const pelletHash = lucid.newScript(pelletValidator).toHash();
const pelletAddress = lucid.newScript(pelletValidator).toAddress();

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

const spacetimeValidator = new SpacetimeSpacetimeSpend(
  pelletHash,
  asteriaHash,
  admin_token,
  max_speed,
  max_ship_fuel,
  fuel_per_step,
);
const spacetimeHash = lucid.newScript(spacetimeValidator).toHash();
const spacetimeAddress = lucid.newScript(spacetimeValidator).toAddress();

console.log("ASTERIA SCRIPT ADDRESS:", { asteriaAddress, asteriaHash });
console.log("SPACETIME SCRIPT ADDRESS:", { spacetimeAddress, spacetimeHash });
console.log("PELLET SCRIPT ADDRESS:", { pelletAddress, pelletHash });

//
// ASTERIA 
//
const adminToken = admin_token.policy + admin_token.name;
const asteriaDatum = {
  shipCounter: 0n,
  shipyardPolicy: spacetimeHash,
};

//
// DEPLOYMENT TX (REFERENCE SCRIPTS AND ASTERIA)
//
const deployTx = await lucid
  .newTx()
  .payToContract(
    deployAddress,
    {
      Inline: Data.void(),
      scriptRef: asteriaValidator,
    },
    {}
  )
  .payToContract(
    deployAddress,
    {
      Inline: Data.void(),
      scriptRef: spacetimeValidator,
    },
    {}
  )
  .payToContract(
    deployAddress,
    {
      Inline: Data.void(),
      scriptRef: pelletValidator,
    },
    {}
  )
  .payToContract(
    asteriaAddress,
    { Inline: Data.to(asteriaDatum, AsteriaAsteriaSpend.datum) },
    {
      [adminToken]: 1n,
    }
  )
  .commit();

const signedDeployTx = await deployTx.sign().commit();
// console.log(signedDeployTx.toString());
const deployTxHash = await signedDeployTx.submit();
console.log("\nDEPLOYMENT TXHASH:", deployTxHash);
console.log("Waiting for deployment transaction to be confirmed...");
await lucid.awaitTx(deployTxHash);

// This is a workaround to wait for the wallet UTxOs to be updated after the deployment transaction.
// This way we avoid errors like trying to use inputs that were already spent.
let wereUTxOsUpdated = false;
while (!wereUTxOsUpdated) {
  console.log("Waiting for wallet UTXOs to be updated...");
  await delay(5000);
  const walletUTXOs = await lucid.wallet.getUtxos();
  wereUTxOsUpdated = !haveSameUTxOs(walletUTXOs, initialWalletUTXOs);
}

//
// CREATE PELLETS
//
console.log("\nCREATING PELLETS");

const pelletRefs = await lucid.utxosByOutRef([{
  txHash: deployTxHash,
  outputIndex: 2,
}]);

const pellets = await readPelletsCSV("./pellets.csv");
const fuelToken = pelletHash + fromText("FUEL");

const chunkLength = 80;
const chunkedPellets: Utxo[][] = chunkArray(pellets, chunkLength);

let totalCreated = 0;
for (const chunk of chunkedPellets) {
  const initialWalletUTXOs = await lucid.wallet.getUtxos();

  let pelletsTx = await lucid.newTx().readFrom(pelletRefs);
  for (const pellet of chunk) {
    const pelletDatum = {
      posX: pellet.pos_x,
      posY: pellet.pos_y,
      shipyardPolicy: spacetimeHash,
    };
  
    let assets = {};
    if (pellet.prize_policy && pellet.prize_name && pellet.prize_amount && pellet.prize_amount > 0) {
      assets = {
        [fuelToken]: pellet.fuel,
        [adminToken]: 1n,
        [pellet.prize_policy + pellet.prize_name]: pellet.prize_amount,
      };
    } else {
      assets = {
        [fuelToken]: pellet.fuel,
        [adminToken]: 1n,
      };
    }
  
    pelletsTx = pelletsTx
      .mint(
        {
          [fuelToken]: pellet.fuel,
        },
        Data.to("MintFuel", PelletPelletMint.redeemer)
      )
      .payToContract(
        pelletAddress,
        { Inline: Data.to(pelletDatum, PelletPelletSpend.datum) },
        assets
      );
  }

  const committedPelletsTx = await pelletsTx.commit();
  const signedPelletsTx = await committedPelletsTx.sign().commit();
  // console.log(signedPelletsTx.toString());
  const pelletsTxHash = await signedPelletsTx.submit();
  
  totalCreated += chunk.length;  
  console.log("\nPELLETS TXHASH:", pelletsTxHash);
  console.log(`Created ${chunk.length} pellets`);
  console.log(`Total created: ${totalCreated} of ${pellets.length}`);
  console.log(`Waiting for transaction to be confirmed...`);
  await lucid.awaitTx(pelletsTxHash);

  // Wait for wallet UTxOs to be updated.
  let wereUTxOsUpdated = false;
  while (!wereUTxOsUpdated) {
    console.log("Waiting for wallet UTXOs to be updated...");
    await delay(5000);
    const walletUTXOs = await lucid.wallet.getUtxos();
    wereUTxOsUpdated = !haveSameUTxOs(walletUTXOs, initialWalletUTXOs);
  }
}
