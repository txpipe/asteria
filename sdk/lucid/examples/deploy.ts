import { fromText, Data } from "https://deno.land/x/lucid@0.20.5/mod.ts";
import {
  AsteriaAsteriaSpend,
  AsteriaTypesAssetClass,
  AsteriaTypesSpeed,
  DeployDeploySpend,
  PelletPelletSpend,
  SpacetimeSpacetimeSpend,
} from "../../../onchain/src/plutus.ts";
import { lucidBase } from "../src/utils.ts";

console.log("DEPLOYING ASTERIA");

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
const tx = await lucid
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

const signedTx = await tx.sign().commit();
// console.log(signedTx.toString());
// const txHash = await signedTx.submit();
const txHash = "fee59afa92a0eff4d8b7532917ea514cee26fd22924c246072891ea741cdfb15";
console.log("DEPLOYMENT TXHASH:", txHash);
