import {
  fromText,
  Addresses,
  Crypto,
  Data,
  Emulator,
  Lucid
} from "https://deno.land/x/lucid@0.20.5/mod.ts";
import {
  AsteriaAsteriaSpend,
  AsteriaTypesAssetClass,
  AsteriaTypesSpeed,
  DeployDeploySpend,
  PelletPelletSpend,
  SpacetimeSpacetimeSpend,
  SpacetimeSpacetimeMint,
  PelletPelletMint,
  AsteriaTypesShipRedeemer,
  AsteriaTypesPelletRedeemer,
} from "../../../onchain/src/plutus.ts";

console.log("CREATING EMULATOR");

const admin_token: AsteriaTypesAssetClass = {
  policy: "0d69753742e6e5fe5f545498708d61f3335adffd90686d41c8529a64",
  name: "0014df105af4eb1811a74ad4e61c45362f84cf69835d2740f9f54019b1e13a07",
};
const adminToken = admin_token.policy + admin_token.name;

// https://github.com/spacebudz/lucid/blob/main/examples/emulate_something.ts
const privateKey = Crypto.generatePrivateKey();
const address = Addresses.credentialToAddress(
  { Emulator: 0 },
  Crypto.privateKeyToDetails(privateKey).credential,
);
const { payment } = Addresses.inspect(address);  // TODO: unused!
const emulator = new Emulator([{
  address,
  assets: {
    lovelace: 3000000000n,
    [adminToken]: 1000n,
  }
}]);
const lucid = new Lucid({
  provider: emulator,
  wallet: { PrivateKey: privateKey },
});
const slotZeroTime = emulator.now();

console.log("SLOT ZERO TIME:", slotZeroTime);

console.log("DEPLOYING ASTERIA");

//
// CONFIGURATION
//
const ship_mint_lovelace_fee = 1_000_000n;
const max_asteria_mining = 50n;
const max_speed: AsteriaTypesSpeed = {
  distance: 1n,
  time: 30n * 1000n, // milliseconds (30 seconds)
};
const max_ship_fuel = 100n;
const fuel_per_step = 1n;
const initial_fuel = 30n;
const min_asteria_distance = 0n;

//
// VALIDATORS INSTANTIATION
//
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
const deployTxHash = await signedDeployTx.submit();
emulator.awaitTx(deployTxHash);
console.log("DEPLOYMENT TXHASH:", deployTxHash);

//
// UTXO QUERIES
//
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
const asteriaDatum2 = Data.from(asteria.datum, AsteriaAsteriaSpend.datum);
// console.log(asteriaDatum2);

//
// CREATE PELLET
//
const fuelToken = pelletHash + fromText("FUEL");
const pelletDatum = {
  posX: 0n,
  posY: 0n,
  shipyardPolicy: spacetimeHash,
};
const pelletTx = await lucid
  .newTx()
  .readFrom([pelletRef])
  .mint(
    {
      [fuelToken]: 1000n,
    },
    Data.to("MintFuel", PelletPelletMint.redeemer)
  )
  .payToContract(
    pelletAddress,
    { Inline: Data.to(pelletDatum, PelletPelletSpend.datum) },
    {
      [adminToken]: 1n,
      [fuelToken]: 1000n,
    }
  )
  .commit();

const signedPelletTx = await pelletTx.sign().commit();
const pelletTxHash = await signedPelletTx.submit();
emulator.awaitTx(pelletTxHash);
console.log("PELLET TXHASH:", pelletTxHash);

//
// SHIP CREATION TX
//
// const fuelToken = pelletHash + fromText("FUEL");
const shipToken = spacetimeHash + fromText("SHIP" + asteriaDatum.shipCounter);
const pilotToken = spacetimeHash + fromText("PILOT" + asteriaDatum.shipCounter);

const ttl = emulator.now() + 10 * 60 * 1000; // now + 10 minutes (in miliseconds)
console.log("NOW:", ttl);

const shipDatum = {
  posX: 0n,
  posY: 0n,
  shipTokenName: fromText("SHIP" + asteriaDatum.shipCounter),
  pilotTokenName: fromText("PILOT" + asteriaDatum.shipCounter),
  lastMoveLatestTime: BigInt(ttl),
};
const asteriaDatum3 = {
  shipCounter: asteriaDatum.shipCounter + 1n,
  shipyardPolicy: asteriaDatum.shipyardPolicy,
};

const createShipTx = await lucid
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
    { Inline: Data.to(asteriaDatum3, AsteriaAsteriaSpend.datum) },
    {
      [adminToken]: 1n,
      lovelace: asteria.assets.lovelace + ship_mint_lovelace_fee,
    }
  )
  .commit();

const signedCreateShipTx = await createShipTx.sign().commit();
const createShipTxHash = await signedCreateShipTx.submit();
emulator.awaitTx(createShipTxHash);
console.log("CREATE SHIP TXHASH:", createShipTxHash);

//
// GATHER FUEL TX
//
const [ship] = await lucid.utxosByOutRef([{
  txHash: createShipTxHash,
  outputIndex: 0,  // the ship is always the first output
}]);
const [pellet] = await lucid.utxosByOutRef([{
  txHash: pelletTxHash,
  outputIndex: 0,
}]);

const gatherRedeemer : AsteriaTypesShipRedeemer = {
  GatherFuel: { amount: 22n }
};
const gatherRedeemerData = Data.to(gatherRedeemer, SpacetimeSpacetimeSpend.redeemer);
console.log("gatherRedeemerData:", gatherRedeemerData);

const pelletRedeemer : AsteriaTypesPelletRedeemer = {
  Provide: { amount: 22n }
};
const pelletRedeemerData = Data.to(pelletRedeemer, PelletPelletSpend.redeemer);
console.log("pelletRedeemerData:", pelletRedeemerData);

// one minute later after create ship ttl (slot = seconds = ms / 1000)
const slot = (ttl - slotZeroTime) / 1000 + 60;
console.log("SLOT:", slot);
emulator.awaitSlot(slot);
console.log("TIMESTAMP:", slot * 1000 + slotZeroTime);
console.log("emulator now:", emulator.now());

// const ttl2 = emulator.now() - 10 * 60 * 1000; // now - 10 minutes (in miliseconds)
const ttl2 = emulator.now() - 60 * 1000; // now - 1 minutes (in miliseconds)
console.log("NOW2:", ttl2);

const gatherTx = await lucid
  .newTx()
  .validFrom(ttl2)
  .readFrom([spacetimeRef, pelletRef])
  .collectFrom([ship], gatherRedeemerData)
  .collectFrom([pellet], pelletRedeemerData)
  .payToContract(
    spacetimeAddress,
    // reuse shipDatum
    { Inline: Data.to(shipDatum, SpacetimeSpacetimeSpend.datum) },
    {
      [shipToken]: 1n,
      [fuelToken]: initial_fuel + 22n,
    }
  )
  .payToContract(
    pelletAddress,
    // reuse pelletDatum
    { Inline: Data.to(pelletDatum, PelletPelletSpend.datum) },
    {
      [adminToken]: 1n,
      [fuelToken]: 1000n - 22n,
    }
  )
  .payTo(await lucid.wallet.address(), {
    [pilotToken]: 1n,
  })
  .commit();

const signedGatherTx = await gatherTx.sign().commit();
const gatherTxHash = await signedGatherTx.submit();
emulator.awaitTx(gatherTxHash);
console.log("GATHER FUEL TXHASH:", gatherTxHash);

//
// MINE ASTERIA TX
//
const [ship2] = await lucid.utxosByOutRef([{
  txHash: gatherTxHash,
  outputIndex: 0,  // the ship is always the first output
}]);
const [asteria2] = await lucid.utxosByOutRef([{
  txHash: createShipTxHash,
  outputIndex: 1,  // Asteria is always the second output
}]);

// one minute later after gather ttl (slot = seconds = ms / 1000)
const slot2 = (ttl2 - slotZeroTime) / 1000 + 60;
console.log("SLOT:", slot2);
emulator.awaitSlot(slot2);
console.log("TIMESTAMP:", slot2 * 1000 + slotZeroTime);
console.log("emulator now:", emulator.now());

const ttl3 = emulator.now() + 10 * 60 * 1000; // now + 10 minutes (in miliseconds)
console.log("NOW3:", ttl3);

const mineTx = await lucid
  .newTx()
  // XXX: validFrom in the future. is this right?
  .validFrom(ttl3)
  .readFrom([spacetimeRef, asteriaRef, pelletRef])
  .collectFrom([ship], Data.to("MineAsteria", SpacetimeSpacetimeSpend.redeemer))
  .collectFrom([asteria2], Data.to("Mine", AsteriaAsteriaSpend.redeemer))
  .mint(
    {
      [shipToken]: -1n,
    },
    Data.to("BurnShip", SpacetimeSpacetimeMint.redeemer)
  )
  .mint(
    {
      [fuelToken]: -initial_fuel,
    },
    Data.to("BurnFuel", PelletPelletMint.redeemer)
  )
  .payToContract(
    asteriaAddress,
    // reusing asteriaDatum3 here:
    { Inline: Data.to(asteriaDatum3, AsteriaAsteriaSpend.datum) },
    {
      [adminToken]: 1n,
      lovelace: asteria2.assets.lovelace, // rewards - minedRewards,
    }
  )
  .payTo(await lucid.wallet.address(), {
    [pilotToken]: 1n,
  })
// .toInstructions();
  .commit();

console.log(mineTx);
