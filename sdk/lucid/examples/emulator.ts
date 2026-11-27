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
  DeployDeploySpend,
  PelletPelletSpend,
  SpacetimeSpacetimeSpend,
  SpacetimeSpacetimeMint,
  PelletPelletMint,
  AsteriaTypesShipRedeemer,
  AsteriaTypesSpeed,
  AsteriaTypesPelletRedeemer,
} from "../../../onchain/src/plutus.ts";
import {
  admin_token,
  ship_mint_lovelace_fee,
  // initial_fuel,
  max_asteria_mining,
  min_asteria_distance,
  // max_speed,
  max_ship_fuel,
  fuel_per_step
} from "../src/configurations.ts"

// override max speed to allow distance 40 in 10 minutes
const max_speed: AsteriaTypesSpeed = {
  distance: 2n,
  time: 30n * 1000n, // milliseconds (30 seconds)
};

// override initial fuel to have enough
const initial_fuel = 40n


console.log("CREATING EMULATOR");

const adminToken = admin_token.policy + admin_token.name;
const presentToken = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" + fromText("gold ring");
const presentToken2 = "feeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" + fromText("fart");

// https://github.com/spacebudz/lucid/blob/main/examples/emulate_something.ts
const privateKey = Crypto.generatePrivateKey();
const address = Addresses.credentialToAddress(
  { Emulator: 0 },
  Crypto.privateKeyToDetails(privateKey).credential,
);
const { payment } = Addresses.inspect(address);
const emulator = new Emulator([{
  address,
  assets: {
    lovelace: 3000000000n,
    [adminToken]: 1000n,
    [presentToken]: 10n,
    [presentToken2]: 10n,
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
// DEPLOYMENT TX 1 (REFERENCE SCRIPTS AND ASTERIA)
//
const deployTx1 = await lucid
  .newTx()
  .payToContract(
    deployAddress,
    {
      Inline: Data.void(),
      scriptRef: asteriaValidator,
    },
    {}
  )
  // .payToContract(
  //   deployAddress,
  //   {
  //     Inline: Data.void(),
  //     scriptRef: spacetimeValidator,
  //   },
  //   {}
  // )
  // .payToContract(
  //   deployAddress,
  //   {
  //     Inline: Data.void(),
  //     scriptRef: pelletValidator,
  //   },
  //   {}
  // )
  .payToContract(
    asteriaAddress,
    { Inline: Data.to(asteriaDatum, AsteriaAsteriaSpend.datum) },
    {
      [adminToken]: 1n,
    }
  )
  .commit();

const signedDeployTx1 = await deployTx1.sign().commit();
const deployTxHash1 = await signedDeployTx1.submit();
emulator.awaitTx(deployTxHash1);
console.log("DEPLOYMENT TXHASH:", deployTxHash1);

//
// DEPLOYMENT TX 2 (REFERENCE SCRIPTS AND ASTERIA)
//
const deployTx2 = await lucid
  .newTx()
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
  .commit();

const signedDeployTx2 = await deployTx2.sign().commit();
const deployTxHash2 = await signedDeployTx2.submit();
emulator.awaitTx(deployTxHash2);
console.log("DEPLOYMENT TXHASH:", deployTxHash2);

//
// UTXO QUERIES
//
const [asteriaRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash1,
  outputIndex: 0,
}]);
const [spacetimeRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash2,
  outputIndex: 0,
}]);
const [pelletRef] = await lucid.utxosByOutRef([{
  txHash: deployTxHash2,
  outputIndex: 1,
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
  posX: 20n,
  posY: 20n,
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
      // pellets can work without an admin token:
      // [adminToken]: 1n,
      [fuelToken]: 1000n,
      [presentToken]: 5n,
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
const shipToken = spacetimeHash + fromText("SHIP" + asteriaDatum.shipCounter);
const pilotToken = spacetimeHash + fromText("PILOT" + asteriaDatum.shipCounter);

const ttl = emulator.now() + 10 * 60 * 1000; // now + 10 minutes (in miliseconds)

const shipDatum = {
  posX: 20n,
  posY: 20n,
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

const pelletRedeemer : AsteriaTypesPelletRedeemer = {
  Provide: { amount: 22n }
};
const pelletRedeemerData = Data.to(pelletRedeemer, PelletPelletSpend.redeemer);

// one minute later after create ship ttl (slot = seconds = ms / 1000)
const slot = (ttl - slotZeroTime) / 1000 + 60;
emulator.awaitSlot(slot);

const now = emulator.now();

const gatherTx = await lucid
  .newTx()
  .validFrom(now - 60 * 1000)  // now - 1 minutes (in miliseconds)
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
      lovelace: pellet.assets.lovelace,  // can't touch locked lovelace
      // [adminToken]: 1n,
      [fuelToken]: 1000n - 22n,
      [presentToken]: 3n,  // take two present tokens
      // [presentToken]: 7n,  // add present tokens (should fail)
      // [presentToken2]: 1n,  // add strange token (should fail)s
    }
  )
  .payTo(await lucid.wallet.address(), {
    [pilotToken]: 1n,
    // [presentToken]: 5n,
    // [presentToken2]: 5n,
  })
  .commit();

const signedGatherTx = await gatherTx.sign().commit();
const gatherTxHash = await signedGatherTx.submit();
emulator.awaitTx(gatherTxHash);
console.log("GATHER FUEL TXHASH:", gatherTxHash);

//
// MOVE SHIP TX
//
const [ship2] = await lucid.utxosByOutRef([{
  txHash: gatherTxHash,
  outputIndex: 0,  // the ship is always the first output
}]);

const moveRedeemer : AsteriaTypesShipRedeemer = {
  MoveShip: {
    deltaX: -20n,
    deltaY: -20n,
  }
};
const moveRedeemerData = Data.to(moveRedeemer, SpacetimeSpacetimeSpend.redeemer);

// const slot2 = (now - slotZeroTime) / 1000;
// emulator.awaitSlot(slot2);

const ttl3 = emulator.now() + 10 * 60 * 1000; // now + 10 minutes (in miliseconds)

const shipDatum2 = {
  posX: 0n,
  posY: 0n,
  shipTokenName: fromText("SHIP" + asteriaDatum.shipCounter),
  pilotTokenName: fromText("PILOT" + asteriaDatum.shipCounter),
  lastMoveLatestTime: BigInt(ttl3 + 1),
};

const moveTx = await lucid
  .newTx()
  .validFrom(ttl3 - 10 * 60 * 1000)  // 10 minutes before TTL
  .validTo(ttl3)
  .readFrom([spacetimeRef, pelletRef])
  .collectFrom([ship2], moveRedeemerData)
  .payToContract(
    spacetimeAddress,
    { Inline: Data.to(shipDatum2, SpacetimeSpacetimeSpend.datum) },
    {
      [shipToken]: 1n,
      [fuelToken]: initial_fuel + 22n - 40n,
    }
  )
  .payTo(await lucid.wallet.address(), {
    [pilotToken]: 1n,
  })
  .mint(
    {
      [fuelToken]: -40n,
    },
    Data.to("BurnFuel", PelletPelletMint.redeemer)
  )
  .commit();

const signedMoveTx = await moveTx.sign().commit();
const moveTxHash = await signedMoveTx.submit();
emulator.awaitTx(moveTxHash);
console.log("MOVE SHIP TXHASH:", moveTxHash);

//
// TODO: MINE ASTERIA
//
