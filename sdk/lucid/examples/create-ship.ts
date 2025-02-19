import { fromText, Data } from "https://deno.land/x/lucid@0.20.5/mod.ts";
import {
  AsteriaAsteriaSpend,
  AsteriaTypesAssetClass,
  AsteriaTypesSpeed,
  DeployDeploySpend,
  PelletPelletSpend,
  SpacetimeSpacetimeSpend,
  SpacetimeSpacetimeMint,
  PelletPelletMint
} from "../../../onchain/src/plutus.ts";
import { lucidBase } from "../src/utils.ts";

console.log("CREATING SHIP");

//
// CONFIGURATION
//
const admin_token: AsteriaTypesAssetClass = {
  policy: "0d69753742e6e5fe5f545498708d61f3335adffd90686d41c8529a64",
  name: "0014df105af4eb1811a74ad4e61c45362f84cf69835d2740f9f54019b1e13a07",
};
const ship_mint_lovelace_fee = 1_000_000n;
const max_asteria_mining = 50n;
const max_speed: AsteriaTypesSpeed = {
  distance: 1n,
  time: 30n * 1000n, // milliseconds (30 seconds)
};
const max_ship_fuel = 100n;
const fuel_per_step = 1n;
const initial_fuel = 30n;
const min_asteria_distance = 10n;

//
// VALIDATORS INSTANTIATION
//
const lucid = await lucidBase();

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
// UTXO QUERIES
//
const deployTxHash = "fee59afa92a0eff4d8b7532917ea514cee26fd22924c246072891ea741cdfb15";
// TODO: can we do this shorter?
const [asteriaRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash,
  outputIndex: 0,
}]);
const [spacetimeRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash,
  outputIndex: 1,
}]);
const [pelletRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash,
  outputIndex: 2,
}]);

const [asteria] = await lucid.utxosAt(asteriaAddress);
// TODO: check admin token
const asteriaDatum = Data.from(asteria.datum, AsteriaAsteriaSpend.datum);
// console.log(asteriaDatum);

//
// SHIP CREATION TX
//
const adminToken = admin_token.policy + admin_token.name;
const fuelToken = pelletHash + fromText("FUEL");
const shipToken = spacetimeHash + fromText("SHIP" + asteriaDatum.shipCounter);
const pilotToken = spacetimeHash + fromText("PILOT" + asteriaDatum.shipCounter);

const ttl = Date.now() + 10 * 60 * 1000; // now + 10 minutes (in miliseconds)
// console.log("NOW:", ttl);

const shipDatum = {
  posX: 20n,
  posY: 20n,
  shipTokenName: fromText("SHIP" + asteriaDatum.shipCounter),
  pilotTokenName: fromText("PILOT" + asteriaDatum.shipCounter),
  lastMoveLatestTime: BigInt(ttl),
};
const asteriaDatum2 = {
  shipCounter: asteriaDatum.shipCounter + 1n,
  shipyardPolicy: asteriaDatum.shipyardPolicy,
};

const tx = await lucid
  .newTx()
  .validTo(ttl)  // beware: this number gets rounded down
  .readFrom([asteriaRef, spacetimeRef, pelletRef])
  .collectFrom(
    [asteria],
    Data.to("AddNewShip", AsteriaAsteriaSpend.redeemer)
  )
  .mint(
    {
      [shipToken]: 1n,
      [pilotToken]: 1n,
    },
    Data.to("MintShip", SpacetimeSpacetimeMint.redeemer)
  )
  .mint(
    {
      [fuelToken]: initial_fuel,
    },
    Data.to("MintFuel", PelletPelletMint.redeemer)
  )
  .payToContract(
    spacetimeAddress,
    { Inline: Data.to(shipDatum, SpacetimeSpacetimeSpend.datum) },
    {
      [shipToken]: 1n,
      [fuelToken]: initial_fuel,
    }
  )
  .payToContract(
    asteriaAddress,
    { Inline: Data.to(asteriaDatum2, AsteriaAsteriaSpend.datum) },
    {
      [adminToken]: 1n,
      lovelace: asteria.assets.lovelace + ship_mint_lovelace_fee,
    }
  )
  // .toInstructions();
  .commit();

const signedTx = await tx.sign().commit();
// console.log(signedTx.toString());
const txHash = await signedTx.submit();
console.log("CREATE SHIP TXHASH:", txHash);
