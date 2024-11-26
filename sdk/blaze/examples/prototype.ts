import {
  AssetId,
  Bip32PrivateKey,
  mnemonicToEntropy,
  Slot,
  TransactionId,
  TransactionInput,
  TransactionUnspentOutput,
  wordlist,
} from "@blaze-cardano/core";
import {
  Blaze,
  Constr,
  Core,
  Data,
  HotWallet,
  Kupmios,
  makeValue,
  Static,
} from "@blaze-cardano/sdk";
import { slotToUnix } from "../src/utils";
import { Unwrapped } from "@blaze-cardano/ogmios";

//Working Prototype Functions

async function blazeBase() {
  const provider = new Kupmios(
    "https://kupo1dce45wncnj6zgxxext7.preview-v2.kupo-m1.demeter.run",
    await Unwrapped.Ogmios.new(
      "https://ogmios13lw5mnhwypg5shrt9eh.preview-v5.ogmios-m1.demeter.run",
    ),
  );
  const seed = process.env.SEED!;

  const entropy = mnemonicToEntropy(seed, wordlist);
  const masterkey = Bip32PrivateKey.fromBip39Entropy(Buffer.from(entropy), "");
  const wallet = await HotWallet.fromMasterkey(masterkey.hex(), provider);

  return Blaze.from(provider, wallet);
}

async function createAsteria() {
  const blaze = await blazeBase();
  const wallet = blaze.wallet;

  const shipyard_policy =
    "d793347e2eda051b4524de296545a150f9e8b30ddfe6f8c42f7ae060";

  const admin_policy =
    "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa";
  const admin_assetName = "417374657269612041646D696E";

  const admin_token = AssetId(admin_policy + admin_assetName);

  const validatorAddress = Core.Address.fromBech32(
    "addr_test1wr44k7mvy2aznjn5qk69xa5gax0fsxmv4q8n9xv9040kqjs9kcchd",
  );

  const DatumSchema = Data.Object({
    ship_counter: Data.Integer(),
    shipyard_policy: Data.Bytes(),
  });

  type Datum = Static<typeof DatumSchema>;
  const Datum = DatumSchema as unknown as Datum;

  const datumData = {
    ship_counter: 0n,
    shipyard_policy: shipyard_policy,
  };

  const datum = Data.to(datumData, Datum);

  const tx = await blaze
    .newTransaction()
    .lockAssets(
      validatorAddress,
      makeValue(5000000n, [admin_token, 1n]),
      datum,
    )
    .setChangeAddress(wallet.address)
    .complete();

  console.log(tx.toCbor().length);

  const signedTx = await blaze.signTransaction(tx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}

async function consumeAsteria() {
  const blaze = await blazeBase();
  const wallet = blaze.wallet;

  const admin_policy =
    "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa";
  const admin_assetName = "417374657269612041646D696E";

  const asteria_input = new TransactionInput(
    TransactionId(
      "cb65049ac808aa9f99583937ddc8265a9bf93357cb4043509870c2501c8c05a4",
    ),
    0n,
  );

  const asteria_ref = new TransactionInput(
    TransactionId(
      "a2023fce7f76fc87e464a7d7507d720842d93d63291adb84a254c268c56f72b3",
    ),
    0n,
  );

  const ref_utxo = await blaze.provider.resolveUnspentOutputs([asteria_ref]);

  const asteria_utxos = await blaze.provider.resolveUnspentOutputs([
    asteria_input,
  ]);

  const admin_token = AssetId(admin_policy + admin_assetName);

  const admin_utxos = await blaze.provider.getUnspentOutputsWithAsset(
    wallet.address,
    admin_token,
  );

  const redeemer = Data.to(new Constr(2, []));

  const tx = await blaze
    .newTransaction()
    .addReferenceInput(ref_utxo[0])
    .addInput(admin_utxos[0])
    .addInput(asteria_utxos[0], redeemer)
    .complete();

  const signedTx = await blaze.signTransaction(tx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}

async function createPelletState() {
  const blaze = await blazeBase();
  const wallet = blaze.wallet;

  const shipyard_policy =
    "d793347e2eda051b4524de296545a150f9e8b30ddfe6f8c42f7ae060";

  const admin_policy =
    "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa";
  const admin_assetName = "417374657269612041646D696E";
  const admin_token = AssetId(admin_policy + admin_assetName);

  const reward_policy =
    "5ca0cf636772f86845be59ef670f127dc83aed7d2a7ce398c41ede79";
  const reward_asset_name = "52657761726420546F6B656E";
  const reward_token = AssetId(reward_policy + reward_asset_name);

  const fuel_policy =
    "dc4780e65e268b41a6b7a6669ec67199086efda5bfa54c86b79bbe02";
  const fuel_assetName = "4655454C";
  const fuel_token = AssetId(fuel_policy + fuel_assetName);

  const ref = new TransactionInput(
    TransactionId(
      "c6408f164e408783963c202dcbf15d8a3fcd10a1263594fb091763df1014cad2",
    ),
    0n,
  );

  const refOutputs = await blaze.provider.resolveUnspentOutputs([
    ref,
  ]);

  const admin_utxos = await blaze.provider.getUnspentOutputsWithAsset(
    wallet.address,
    admin_token,
  );

  const pos_x = 8n;
  const pos_y = 8n;

  const validatorAddress = Core.Address.fromBech32(
    "addr_test1wrwy0q8xtcngksdxk7nxd8kxwxvssmha5kl62nyxk7dmuqsf3slrx",
  );

  const DatumSchema = Data.Object({
    pos_x: Data.Integer(),
    pos_y: Data.Integer(),
    shipyard_policy: Data.Bytes(),
  });

  type Datum = Static<typeof DatumSchema>;
  const Datum = DatumSchema as unknown as Datum;

  const datumData = {
    pos_x: pos_x,
    pos_y: pos_y,
    shipyard_policy: shipyard_policy,
  };

  const datum = Data.to(datumData, Datum);

  const redeemer = Data.to(new Constr(0, []));

  const tx = await blaze
    .newTransaction()
    .addReferenceInput(refOutputs[0])
    .addInput(admin_utxos[0])
    .addMint(
      AssetId.getPolicyId(fuel_token),
      new Map([[AssetId.getAssetName(fuel_token), 1500n]]),
      redeemer,
    )
    .lockAssets(
      validatorAddress,
      makeValue(1000000n, [admin_token, 1n], [fuel_token, 1500n], [
        reward_token,
        20n,
      ]),
      datum,
    )
    .setChangeAddress(wallet.address)
    .complete();

  const signedTx = await blaze.signTransaction(tx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}

async function consumePelletState() {
  const blaze = await blazeBase();
  const wallet = blaze.wallet;

  const admin_policy =
    "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa";
  const admin_assetName = "417374657269612041646D696E";

  const fuel_policy =
    "dc4780e65e268b41a6b7a6669ec67199086efda5bfa54c86b79bbe02";
  const fuel_assetName = "4655454C";
  const fuel_token = AssetId(fuel_policy + fuel_assetName);

  const pellet_ref = new TransactionInput(
    TransactionId(
      "c6408f164e408783963c202dcbf15d8a3fcd10a1263594fb091763df1014cad2",
    ),
    0n,
  );

  const pellet_address = Core.Address.fromBech32(
    "addr_test1wrwy0q8xtcngksdxk7nxd8kxwxvssmha5kl62nyxk7dmuqsf3slrx",
  );

  const ref_utxos = await blaze.provider.resolveUnspentOutputs([pellet_ref]);

  const admin_token = AssetId(admin_policy + admin_assetName);

  const admin_utxos = await blaze.provider.getUnspentOutputsWithAsset(
    wallet.address,
    admin_token,
  );

  const fuel_utxos = await blaze.provider.getUnspentOutputsWithAsset(
    pellet_address,
    fuel_token,
  );

  const redeemer = Data.to(new Constr(1, []));

  // fuel_utxos.forEach((utxo) => console.log(utxo.toCore()));

  const baseTx = await blaze
    .newTransaction()
    .addReferenceInput(ref_utxos[0])
    .addInput(admin_utxos[0]);

  for (let i = 0; i < 10; i++) {
    baseTx.addInput(fuel_utxos[i], redeemer);
  }

  const finalTx = await baseTx.complete();
  const signedTx = await blaze.signTransaction(finalTx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}

async function createShipState() {
  const blaze = await blazeBase();

  const asteria_tx = new TransactionInput(
    TransactionId(
      "c367dd5ff68857181068cc6168e8ad30fd21ce60c37733feca6a25e8f92a581d",
    ),
    1n,
  );

  const spacetime_tx = new TransactionInput(
    TransactionId(
      "b19cb2b6a6cc0f435ef454665cdd437496070bdb6aedebe0f6260037a0f5b257",
    ),
    0n,
  );

  const pellet_tx = new TransactionInput(
    TransactionId(
      "c6408f164e408783963c202dcbf15d8a3fcd10a1263594fb091763df1014cad2",
    ),
    0n,
  );
  const asteria_ref = new TransactionInput(
    TransactionId(
      "a2023fce7f76fc87e464a7d7507d720842d93d63291adb84a254c268c56f72b3",
    ),
    0n,
  );

  const asteria_utxos = await blaze.provider.resolveUnspentOutputs([
    asteria_tx,
  ]);

  const asteria_ref_utxos = await blaze.provider.resolveUnspentOutputs([
    asteria_ref,
  ]);

  const spacetime_ref_utxos = await blaze.provider.resolveUnspentOutputs([
    spacetime_tx,
  ]);

  const pellet_utxos = await blaze.provider.resolveUnspentOutputs([pellet_tx]);

  const asteria_datum = asteria_utxos[0].output().datum()!.asInlineData()!;

  const AsteriaDatumSchema = Data.Object({
    ship_counter: Data.Integer(),
    shipyard_policy: Data.Bytes(),
  });
  type AsteriaDatum = Static<typeof AsteriaDatumSchema>;
  const AsteriaDatum = AsteriaDatumSchema as unknown as AsteriaDatum;

  const asteria_datum_data = Data.from(
    asteria_datum,
    AsteriaDatum,
  );

  const new_asteria_datum_data = {
    ship_counter: asteria_datum_data.ship_counter + 1n,
    shipyard_policy: asteria_datum_data.shipyard_policy,
  };
  const new_asteria_datum = Data.to(new_asteria_datum_data, AsteriaDatum);

  const ship_name = "SHIP" + asteria_datum_data.ship_counter.toString();
  const pilot_name = "PILOT" + asteria_datum_data.ship_counter.toString();
  // console.log({ship_name, pilot_name})

  const shipyard_policy =
    "d793347e2eda051b4524de296545a150f9e8b30ddfe6f8c42f7ae060";

  const ship_asset_name = Buffer.from(ship_name, "utf-8").toString("hex");
  const pilot_asset_name = Buffer.from(pilot_name, "utf-8").toString("hex");
  const ship_token = AssetId(shipyard_policy + ship_asset_name);
  const pilot_token = AssetId(shipyard_policy + pilot_asset_name);

  console.log(AssetId.getPolicyId(ship_token));

  const admin_policy =
    "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa";
  const admin_assetName = "417374657269612041646D696E";
  const admin_token = AssetId(admin_policy + admin_assetName);

  const fuel_policy =
    "dc4780e65e268b41a6b7a6669ec67199086efda5bfa54c86b79bbe02";
  const fuel_assetName = "4655454C";
  const fuel_token = AssetId(fuel_policy + fuel_assetName);

  const initial_fuel = 480n;
  const pos_x = 20n;
  const pos_y = 20n;
  const ship_mint_fee = 1000000n;
  const total_rewards = asteria_utxos[0].output().amount().coin() +
    ship_mint_fee;
  const current_posix_time = Date.now() + 60000;

  const asteria_validator_address = Core.Address.fromBech32(
    "addr_test1wr44k7mvy2aznjn5qk69xa5gax0fsxmv4q8n9xv9040kqjs9kcchd",
  );

  const spacetime_validator_address = Core.Address.fromBech32(
    "addr_test1wrtexdr79mdq2x69yn0zje2959g0n69nph07d7xy9aawqcquqezly",
  );

  const ShipDatumSchema = Data.Object({
    pos_x: Data.Integer(),
    pos_y: Data.Integer(),
    ship_token_name: Data.Bytes(),
    pilot_token_name: Data.Bytes(),
    tx_latest_posix_time: Data.Integer(),
  });

  type ShipDatum = Static<typeof ShipDatumSchema>;
  const ShipDatum = ShipDatumSchema as unknown as ShipDatum;

  const query_tip_result = await blaze.provider.ogmios.queryNetworkTip();
  const network_tip =JSON.parse(JSON.stringify(query_tip_result));
  const latest_slot = network_tip.slot;
  const unix = slotToUnix(latest_slot);


  const datumData = {
    pos_x: pos_x,
    pos_y: pos_y,
    ship_token_name: ship_asset_name,
    pilot_token_name: pilot_asset_name,
    tx_latest_posix_time: BigInt(unix),
  };

  const ship_datum = Data.to(datumData, ShipDatum);

  const validUntilSlot = Slot(latest_slot);

  const redeemer = Data.to(new Constr(0, []));

  const tx = await blaze
    .newTransaction()
    .setValidUntil(validUntilSlot)
    .addReferenceInput(asteria_ref_utxos[0])
    .addReferenceInput(spacetime_ref_utxos[0])
    .addReferenceInput(pellet_utxos[0])
    .addInput(asteria_utxos[0], redeemer)
    .addMint(
      AssetId.getPolicyId(ship_token),
      new Map([[AssetId.getAssetName(ship_token), 1n], [
        AssetId.getAssetName(pilot_token),
        1n,
      ]]),
      redeemer,
    )
    .lockAssets(
      spacetime_validator_address,
      makeValue(1000000n, [ship_token, 1n], [fuel_token, initial_fuel]),
      ship_datum,
    )
    .addMint(
      AssetId.getPolicyId(fuel_token),
      new Map([[AssetId.getAssetName(fuel_token), initial_fuel]]),
      redeemer,
    )
    .lockAssets(
      asteria_validator_address,
      makeValue(total_rewards, [admin_token, 1n]),
      new_asteria_datum,
    )
    .complete();

  const signedTx = await blaze.signTransaction(tx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}

async function moveShip() {
  const blaze = await blazeBase();
  const wallet = blaze.wallet;

  const ship_tx = new TransactionInput(
    TransactionId(
      "077349dc1fe452d85334b9595f8154816c6bad107103cf7f838efffbe37b30b3",
    ),
    0n,
  );

  const spacetime_ref_tx = new TransactionInput(
    TransactionId(
      "b19cb2b6a6cc0f435ef454665cdd437496070bdb6aedebe0f6260037a0f5b257",
    ),
    0n,
  );

  const pellet_tx = new TransactionInput(
    TransactionId(
      "c6408f164e408783963c202dcbf15d8a3fcd10a1263594fb091763df1014cad2",
    ),
    0n,
  );

  const pellet_utxos = await blaze.provider.resolveUnspentOutputs([pellet_tx]);

  const ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_tx]);

  const spacetime_ref_utxo = await blaze.provider.resolveUnspentOutputs([
    spacetime_ref_tx,
  ]);

  const fuel_policy =
    "dc4780e65e268b41a6b7a6669ec67199086efda5bfa54c86b79bbe02";
  const fuel_assetName = "4655454C";
  const fuel_token = AssetId(fuel_policy + fuel_assetName);

  const shipyard_policy =
    "d793347e2eda051b4524de296545a150f9e8b30ddfe6f8c42f7ae060";

  const utxos = await blaze.provider.getUnspentOutputs(wallet.address);

  let pilot_utxo: TransactionUnspentOutput = utxos[0];

  for (const utxo of utxos) {
    utxo.output().amount().multiasset()?.keys().forEach(
      (asset: any, _index: any) => {
        if (AssetId.getPolicyId(asset).toLowerCase() == shipyard_policy) {
          pilot_utxo = utxo;
        }
      },
    );
  }

  const ship_datum = ship_utxo[0].output().datum()!.asInlineData()!;

  const spacetime_validator_address = Core.Address.fromBech32(
    "addr_test1wrtexdr79mdq2x69yn0zje2959g0n69nph07d7xy9aawqcquqezly",
  );

  const ShipDatumSchema = Data.Object({
    pos_x: Data.Integer(),
    pos_y: Data.Integer(),
    ship_token_name: Data.Bytes(),
    pilot_token_name: Data.Bytes(),
    tx_latest_posix_time: Data.Integer(),
  });
  type ShipDatum = Static<typeof ShipDatumSchema>;
  const ShipDatum = ShipDatumSchema as unknown as ShipDatum;

  const delta_x = -1n;
  const delta_y = -1n;

  const distance = BigInt(
    Math.abs(Number(delta_x)) + Math.abs(Number(delta_y)),
  );
  const required_fuel = 60n;
  const spent_fuel = distance * required_fuel;
  let ship_fuel = 0n;
  ship_utxo[0].output().amount().multiasset()?.forEach(
    (value: any, key: any) => {
      if (AssetId.getPolicyId(key) == AssetId.getPolicyId(fuel_token)) {
        ship_fuel = value;
      }
    },
  );

  const old_ship_datum = Data.from(
    ship_datum,
    ShipDatum,
  );
  const network_tip = await blaze.provider.ogmios.queryNetworkTip();
  const tx_latest_posix_time = unixToSlot(
    Number(old_ship_datum.tx_latest_posix_time),
  );

  const lower_bound_slot = network_tip.slot;
  const lower_bound_unix = slotToUnix(lower_bound_slot);
  const upper_bound = lower_bound_unix + 300000;
  const upper_bound_slot = unixToSlot(upper_bound);

  console.log({ lower_bound_slot, tx_latest_posix_time });

  const new_ship_data = {
    pos_x: old_ship_datum.pos_x + delta_x,
    pos_y: old_ship_datum.pos_y + delta_y,
    ship_token_name: old_ship_datum.ship_token_name,
    pilot_token_name: old_ship_datum.pilot_token_name,
    tx_latest_posix_time: BigInt(upper_bound),
  };

  console.log("old_pos_x: ", old_ship_datum.pos_x);
  console.log("old_pos_y:", old_ship_datum.pos_y);
  const pilot_token = AssetId(
    shipyard_policy + old_ship_datum.pilot_token_name,
  );
  const ship_token = AssetId(shipyard_policy + old_ship_datum.ship_token_name);

  const new_ship_datum = Data.to(new_ship_data, ShipDatum);

  const moveShipRedeemer = Data.to(new Constr(0, [delta_x, delta_y]));
  const burnFuelRedeemer = Data.to(new Constr(1, []));

  const tx = await blaze
    .newTransaction()
    .setValidFrom(Slot(lower_bound_slot))
    .setValidUntil(Slot(upper_bound_slot))
    .addReferenceInput(pellet_utxos[0])
    .addReferenceInput(spacetime_ref_utxo[0])
    .addInput(pilot_utxo)
    .addInput(ship_utxo[0], moveShipRedeemer)
    .addMint(
      AssetId.getPolicyId(fuel_token),
      new Map([[AssetId.getAssetName(fuel_token), -spent_fuel]]),
      burnFuelRedeemer,
    )
    .lockAssets(
      spacetime_validator_address,
      makeValue(1000000n, [fuel_token, ship_fuel - spent_fuel], [
        ship_token,
        1n,
      ]),
      new_ship_datum,
    )
    .payAssets(wallet.address, makeValue(1000000n, [pilot_token, 1n]))
    .complete();

  const signedTx = await blaze.signTransaction(tx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}

async function gatherFuel() {
  const blaze = await blazeBase();
  const wallet = blaze.wallet;

  const ship_tx = new TransactionInput(
    TransactionId(
      "61960654a33e8c93ccbff7c622d136e774b01440d00c87e72e669c4def051b02",
    ),
    0n,
  );
  const pellet_tx = new TransactionInput(
    TransactionId(
      "b3d97a90d382e97dabe384869b09e95bece7b0909bb4535054be57416acdf78e",
    ),
    0n,
  );

  const spacetime_ref_tx = new TransactionInput(
    TransactionId(
      "b19cb2b6a6cc0f435ef454665cdd437496070bdb6aedebe0f6260037a0f5b257",
    ),
    0n,
  );

  const pellet_ref_tx = new TransactionInput(
    TransactionId(
      "c6408f164e408783963c202dcbf15d8a3fcd10a1263594fb091763df1014cad2",
    ),
    0n,
  );

  const pellet_ref_utxos = await blaze.provider.resolveUnspentOutputs([
    pellet_ref_tx,
  ]);

  const pellet_utxos = await blaze.provider.resolveUnspentOutputs([pellet_tx]);

  const ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_tx]);

  const spacetime_ref_utxo = await blaze.provider.resolveUnspentOutputs([
    spacetime_ref_tx,
  ]);

  const fuel_policy =
    "dc4780e65e268b41a6b7a6669ec67199086efda5bfa54c86b79bbe02";
  const fuel_assetName = "4655454C";
  const fuel_token = AssetId(fuel_policy + fuel_assetName);

  const shipyard_policy =
    "d793347e2eda051b4524de296545a150f9e8b30ddfe6f8c42f7ae060";

  const reward_policy =
    "5ca0cf636772f86845be59ef670f127dc83aed7d2a7ce398c41ede79";
  const reward_asset_name = "52657761726420546F6B656E";
  const reward_token = AssetId(reward_policy + reward_asset_name);

  const utxos = await blaze.provider.getUnspentOutputs(wallet.address);

  const ShipDatumSchema = Data.Object({
    pos_x: Data.Integer(),
    pos_y: Data.Integer(),
    ship_token_name: Data.Bytes(),
    pilot_token_name: Data.Bytes(),
    tx_latest_posix_time: Data.Integer(),
  });
  type ShipDatum = Static<typeof ShipDatumSchema>;
  const ShipDatum = ShipDatumSchema as unknown as ShipDatum;

  const PelletDatumSchema = Data.Object({
    pos_x: Data.Integer(),
    pos_y: Data.Integer(),
    shipyard_policy: Data.Bytes(),
  });

  type PelletDatum = Static<typeof PelletDatumSchema>;
  const PelletDatum = PelletDatumSchema as unknown as PelletDatum;

  let pilot_utxo: TransactionUnspentOutput = utxos[0];
  const ship_datum = ship_utxo[0].output().datum()!.asInlineData()!;
  const old_ship_datum = Data.from(ship_datum, ShipDatum);
  const new_ship_datum = Data.to(old_ship_datum, ShipDatum);

  const pellet_datum = pellet_utxos[0].output().datum()!.asInlineData()!;

  const old_pellet_datum = Data.from(pellet_datum, PelletDatum);
  const new_pellet_datum = Data.to(old_pellet_datum, PelletDatum);

  for (const utxo of utxos) {
    utxo.output().amount().multiasset()?.keys().forEach(
      (asset: any, _index: any) => {
        if (
          AssetId.getPolicyId(asset).toLowerCase() == shipyard_policy &&
          AssetId.getAssetName(asset).toLowerCase() ==
            old_ship_datum.pilot_token_name
        ) {
          pilot_utxo = utxo;
        }
      },
    );
  }

  const admin_policy =
    "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa";
  const admin_assetName = "417374657269612041646D696E";
  const admin_token = AssetId(admin_policy + admin_assetName);

  const spacetime_validator_address = Core.Address.fromBech32(
    "addr_test1wrtexdr79mdq2x69yn0zje2959g0n69nph07d7xy9aawqcquqezly",
  );

  const pellet_validator_address = Core.Address.fromBech32(
    "addr_test1wrwy0q8xtcngksdxk7nxd8kxwxvssmha5kl62nyxk7dmuqsf3slrx",
  );

  let ship_fuel = 0n;
  ship_utxo[0].output().amount().multiasset()?.forEach(
    (value: any, key: any) => {
      if (AssetId.getPolicyId(key) == AssetId.getPolicyId(fuel_token)) {
        ship_fuel = value;
      }
    },
  );

  let pellet_fuel = 0n;
  pellet_utxos[0].output().amount().multiasset()?.forEach(
    (value: any, key: any) => {
      if (AssetId.getPolicyId(key) == AssetId.getPolicyId(fuel_token)) {
        pellet_fuel = value;
      }
    },
  );

  const lower_bound = Date.now() - 100000;
  const lower_bound_slot = unixToSlot(lower_bound);

  const amount_to_gather = 1000n;

  const gather_fuel_redeemer = Data.to(new Constr(1, [amount_to_gather]));
  const provide_fuel_redeemer = Data.to(new Constr(0, [amount_to_gather]));

  const pilot_token = AssetId(
    shipyard_policy + old_ship_datum.pilot_token_name,
  );
  const ship_token = AssetId(shipyard_policy + old_ship_datum.ship_token_name);

  const tx = await blaze
    .newTransaction()
    .setValidFrom(Slot(lower_bound_slot))
    .addReferenceInput(pellet_ref_utxos[0])
    .addReferenceInput(spacetime_ref_utxo[0])
    .addInput(pilot_utxo)
    .addInput(ship_utxo[0], gather_fuel_redeemer)
    .addInput(pellet_utxos[0], provide_fuel_redeemer)
    .lockAssets(
      spacetime_validator_address,
      makeValue(1000000n, [fuel_token, ship_fuel + amount_to_gather], [
        ship_token,
        1n,
      ]),
      new_ship_datum,
    )
    .lockAssets(
      pellet_validator_address,
      makeValue(1000000n, [fuel_token, pellet_fuel - amount_to_gather], [
        admin_token,
        1n,
      ]),
      new_pellet_datum,
    )
    .payAssets(wallet.address, makeValue(0n, [pilot_token, 1n]))
    .complete();

  const signedTx = await blaze.signTransaction(tx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}

async function mineAsteria() {
  const blaze = await blazeBase();
  const wallet = blaze.wallet;

  const asteria_ref_tx = new TransactionInput(
    TransactionId(
      "a2023fce7f76fc87e464a7d7507d720842d93d63291adb84a254c268c56f72b3",
    ),
    0n,
  );

  const spacetime_ref_tx = new TransactionInput(
    TransactionId(
      "b19cb2b6a6cc0f435ef454665cdd437496070bdb6aedebe0f6260037a0f5b257",
    ),
    0n,
  );
  const ship_tx = new TransactionInput(
    TransactionId(
      "a065305f62fdb4626bd1f86c8456d0029ceaf2cb682c1fd333f882d107879766",
    ),
    0n,
  );
  const asteria_tx = new TransactionInput(
    TransactionId(
      "6c84a23dfe4f80eb516340ce55938de41d26dc0d719ec42ee37e3fdc93264898",
    ),
    1n,
  );
  const pellet_ref = new TransactionInput(
    TransactionId(
      "c6408f164e408783963c202dcbf15d8a3fcd10a1263594fb091763df1014cad2",
    ),
    0n,
  );

  const pellet_ref_utxo = await blaze.provider.resolveUnspentOutputs([
    pellet_ref,
  ]);

  const asteria_ref_utxo = await blaze.provider.resolveUnspentOutputs([
    asteria_ref_tx,
  ]);
  const spacetime_ref_utxo = await blaze.provider.resolveUnspentOutputs([
    spacetime_ref_tx,
  ]);

  const asteria_utxos = await blaze.provider.resolveUnspentOutputs([
    asteria_tx,
  ]);

  const ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_tx]);

  const shipyard_policy =
    "d793347e2eda051b4524de296545a150f9e8b30ddfe6f8c42f7ae060";

  const fuel_policy =
    "dc4780e65e268b41a6b7a6669ec67199086efda5bfa54c86b79bbe02";
  const fuel_assetName = "4655454C";
  const fuel_token = AssetId(fuel_policy + fuel_assetName);

  const asteria_datum = asteria_utxos[0].output().datum()!.asInlineData()!;

  const AsteriaDatumSchema = Data.Object({
    ship_counter: Data.Integer(),
    shipyard_policy: Data.Bytes(),
  });
  type AsteriaDatum = Static<typeof AsteriaDatumSchema>;
  const AsteriaDatum = AsteriaDatumSchema as unknown as AsteriaDatum;

  const asteria_datum_data = Data.from(
    asteria_datum,
    AsteriaDatum,
  );

  const new_asteria_datum = Data.to(asteria_datum_data, AsteriaDatum);

  const ShipDatumSchema = Data.Object({
    pos_x: Data.Integer(),
    pos_y: Data.Integer(),
    ship_token_name: Data.Bytes(),
    pilot_token_name: Data.Bytes(),
    tx_latest_posix_time: Data.Integer(),
  });
  type ShipDatum = Static<typeof ShipDatumSchema>;
  const ShipDatum = ShipDatumSchema as unknown as ShipDatum;

  const ship_datum = ship_utxo[0].output().datum()!.asInlineData()!;
  const old_ship_datum = Data.from(ship_datum, ShipDatum);

  const ship_token = AssetId(shipyard_policy + old_ship_datum.ship_token_name);
  const pilot_token = AssetId(
    shipyard_policy + old_ship_datum.pilot_token_name,
  );

  let ship_fuel = 0n;
  ship_utxo[0].output().amount().multiasset()?.forEach(
    (value: any, key: any) => {
      if (AssetId.getPolicyId(key) == AssetId.getPolicyId(fuel_token)) {
        ship_fuel = value;
      }
    },
  );

  const total_rewards = asteria_utxos[0].output().amount().coin();
  const user_reward = BigInt(Number(total_rewards) * 0.5);

  const remaining_rewards = total_rewards - user_reward;

  const asteria_validator_address = Core.Address.fromBech32(
    "addr_test1wr44k7mvy2aznjn5qk69xa5gax0fsxmv4q8n9xv9040kqjs9kcchd",
  );

  const admin_policy =
    "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa";
  const admin_assetName = "417374657269612041646D696E";

  const admin_token = AssetId(admin_policy + admin_assetName);

  const network_tip = await blaze.provider.ogmios.queryNetworkTip();

  const lower_bound = JSON.parse(JSON.stringify(network_tip));

  const tx = await blaze
    .newTransaction()
    .setValidFrom(Slot(lower_bound))
    .addReferenceInput(asteria_ref_utxo[0])
    .addReferenceInput(spacetime_ref_utxo[0])
    .addReferenceInput(pellet_ref_utxo[0])
    .addMint(
      AssetId.getPolicyId(ship_token),
      new Map([[AssetId.getAssetName(ship_token), -1n]]),
      Data.to(new Constr(1, [])),
    )
    .addMint(
      AssetId.getPolicyId(fuel_token),
      new Map([[AssetId.getAssetName(fuel_token), -ship_fuel]]),
      Data.to(new Constr(1, [])),
    )
    .addInput(ship_utxo[0], Data.to(new Constr(2, [])))
    .addInput(asteria_utxos[0], Data.to(new Constr(1, [])))
    .lockAssets(
      asteria_validator_address,
      makeValue(remaining_rewards, [admin_token, 1n]),
      new_asteria_datum,
    )
    .payAssets(wallet.address, makeValue(1000000n, [pilot_token, 1n]))
    .complete();

  const signedTx = await blaze.signTransaction(tx);
  const txId = await blaze.provider.postTransactionToChain(signedTx);
  console.log("Transaction ID: ", txId);
}
