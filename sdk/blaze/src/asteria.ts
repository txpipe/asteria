import {
    Address,
    AssetId,
    Slot,
    Transaction,
    TransactionId,
    TransactionInput,
    TransactionUnspentOutput,
} from "@blaze-cardano/core";
import {
    Blaze,
    Constr,
    Core,
    Data,
    Kupmios,
    makeValue,
    Static,
} from "@blaze-cardano/sdk";
import {
    blazeInit,
    extractPolicyIdFromAddress,
    outRefToTransactionInput,
    slotToUnix,
    subjectToAssetId,
    utf8ToHex,
} from "./utils";
import {
    AsteriaDatum,
    AsteriaScriptDatum,
    GameIdentifier,
    PelletDatum,
    PelletScriptDatum,
    ShipDatum,
    SpaceTimeScriptDatum,
} from "./types";
import { max } from "rxjs";

async function createShip(
    provider: Kupmios,
    address: string,
    game_identifier: GameIdentifier,
    pos_x: bigint,
    pos_y: bigint,
): Promise<Transaction> {
    const blaze = await blazeInit(address, provider);

    const spacetime_ref_input = outRefToTransactionInput(
        game_identifier.spacetime_script_reference!,
    );
    const pellet_ref_input = outRefToTransactionInput(
        game_identifier.pellet_script_reference!,
    );
    const asteria_ref_input = outRefToTransactionInput(
        game_identifier.asteria_script_reference!,
    );

    const asteria_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        asteria_ref_input,
    ]);
    const pellet_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        pellet_ref_input,
    ]);
    const spacetime_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        spacetime_ref_input,
    ]);

    const asteria_ref_datum = asteria_ref_utxos[0].output().datum()!
        .asInlineData()!;
    const spacetime_ref_datum = spacetime_ref_utxos[0].output().datum()!
        .asInlineData()!;

    const asteria_validator_address = asteria_ref_utxos[0].output().address();
    const pellet_validator_address = pellet_ref_utxos[0].output().address();
    const spacetime_validator_address = spacetime_ref_utxos[0].output()
        .address();

    const shipyard_policy = extractPolicyIdFromAddress(
        spacetime_validator_address,
    );

    const fuel_policy = extractPolicyIdFromAddress(pellet_validator_address);
    const fuel_assetName = "4655454C";
    const fuel_token = AssetId(fuel_policy + fuel_assetName);

    const asteria_ref_datum_data = Data.from(
        asteria_ref_datum,
        AsteriaScriptDatum,
    );

    const admin_token_from_datum = asteria_ref_datum_data.admin_token;
    const admin_token = AssetId(
        admin_token_from_datum.policy_id + admin_token_from_datum.asset_name,
    );
    const asteria_utxos = await blaze.provider.getUnspentOutputsWithAsset(asteria_validator_address, admin_token);
    const asteria_datum = asteria_utxos[0].output().datum()!.asInlineData()!;
    const spacetime_ref_datum_data = Data.from(
        spacetime_ref_datum,
        SpaceTimeScriptDatum,
    );

    const asteria_datum_data = Data.from(
        asteria_datum,
        AsteriaDatum,
    );

    const ship_name = "SHIP" + asteria_datum_data.ship_counter.toString();
    const pilot_name = "PILOT" + asteria_datum_data.ship_counter.toString();

    const ship_asset_name = utf8ToHex(ship_name);
    const pilot_asset_name = utf8ToHex(pilot_name);
    const ship_token = AssetId(shipyard_policy + ship_asset_name);
    const pilot_token = AssetId(shipyard_policy + pilot_asset_name);

    const total_rewards = asteria_utxos[0].output().amount().coin() +
        asteria_ref_datum_data.ship_mint_lovelace_fee;

    const query_tip_result = await blaze.provider.ogmios.queryNetworkTip();
    const network_tip = JSON.parse(JSON.stringify(query_tip_result));
    const latest_slot = Number(network_tip.slot) + 300;
    const tx_latest_posix_time = slotToUnix(latest_slot);

    const ship_datum_data = {
        pos_x: pos_x,
        pos_y: pos_y,
        ship_token_name: ship_asset_name,
        pilot_token_name: pilot_asset_name,
        tx_latest_posix_time: BigInt(tx_latest_posix_time),
    };

    const ship_datum = Data.to(ship_datum_data, ShipDatum);
    const new_asteria_datum_data = {
        ship_counter: asteria_datum_data.ship_counter + 1n,
        shipyard_policy: asteria_datum_data.shipyard_policy,
    };

    const new_asteria_datum = Data.to(new_asteria_datum_data, AsteriaDatum);

    const redeemer = Data.to(new Constr(0, []));

    const tx = blaze
        .newTransaction()
        .setValidUntil(Slot(latest_slot))
        .addReferenceInput(asteria_ref_utxos[0])
        .addReferenceInput(pellet_ref_utxos[0])
        .addReferenceInput(spacetime_ref_utxos[0])
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
            makeValue(0n, [ship_token, 1n], [
                fuel_token,
                spacetime_ref_datum_data.initial_fuel,
            ]),
            ship_datum,
        )
        .addMint(
            AssetId.getPolicyId(fuel_token),
            new Map([[
                AssetId.getAssetName(fuel_token),
                spacetime_ref_datum_data.initial_fuel,
            ]]),
            redeemer,
        )
        .lockAssets(
            asteria_validator_address,
            makeValue(total_rewards, [admin_token, 1n]),
            new_asteria_datum,
        )
        .complete();

    return tx;
}

async function moveShip(
    provider: Kupmios,
    address: string,
    game_identifier: GameIdentifier,
    delta_x: bigint,
    delta_y: bigint,
): Promise<Transaction> {
    const blaze = await blazeInit(address, provider);

    const ship_input = outRefToTransactionInput(game_identifier.ship_utxo!);
    const spacetime_ref_input = outRefToTransactionInput(
        game_identifier.spacetime_script_reference!,
    );
    const pellet_ref_input = outRefToTransactionInput(
        game_identifier.pellet_script_reference!,
    );

    const spacetime_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        spacetime_ref_input,
    ]);
    const pellet_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        pellet_ref_input,
    ]);

    const ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_input]);

    const spacetime_validator_address = spacetime_ref_utxos[0].output()
        .address();
    const pellet_validator_address = pellet_ref_utxos[0].output().address();

    const fuel_policy = extractPolicyIdFromAddress(pellet_validator_address);
    const fuel_assetName = "4655454C";
    const fuel_token = AssetId(fuel_policy + fuel_assetName);

    const shipyard_policy = extractPolicyIdFromAddress(
        spacetime_validator_address,
    );

    const utxos = await blaze.provider.getUnspentOutputs(blaze.wallet.address);

    const ship_datum = ship_utxo[0].output().datum()!.asInlineData()!;

    const old_ship_datum = Data.from(
        ship_datum,
        ShipDatum,
    );

    let pilot_utxo: TransactionUnspentOutput = utxos[0];
    for (const utxo of utxos) {
        utxo.output().amount().multiasset()?.forEach(
            (value: bigint, asset: AssetId, map: Map<AssetId, bigint>) => {
                if (
                    AssetId.getPolicyId(asset).toLowerCase() ==
                    shipyard_policy.toLowerCase() &&
                    AssetId.getAssetName(asset).toLowerCase() ==
                    old_ship_datum.pilot_token_name.toLowerCase()
                ) {
                    pilot_utxo = utxo;
                }
            },
        );
    }

    const spacetime_ref_datum = spacetime_ref_utxos[0].output().datum()!
        .asInlineData()!;
    const spacetime_ref_datum_data = Data.from(
        spacetime_ref_datum,
        SpaceTimeScriptDatum,
    );

    const distance = BigInt(
        Math.abs(Number(delta_x)) + Math.abs(Number(delta_y)),
    );

    const spent_fuel = distance * spacetime_ref_datum_data.fuel_per_step;

    let ship_fuel = 0n;
    ship_utxo[0].output().amount().multiasset()?.forEach(
        (value: any, key: any) => {
            if (AssetId.getPolicyId(key) == AssetId.getPolicyId(fuel_token)) {
                ship_fuel = value;
            }
        },
    );

    const query_tip_result = await blaze.provider.ogmios.queryNetworkTip();
    const network_tip = JSON.parse(JSON.stringify(query_tip_result));

    const lower_bound_slot = network_tip.slot;
    const lower_bound_unix = slotToUnix(lower_bound_slot);
    const upper_bound_slot = lower_bound_slot + 300;
    const upper_bound = slotToUnix(upper_bound_slot);

    const new_ship_data = {
        pos_x: old_ship_datum.pos_x + delta_x,
        pos_y: old_ship_datum.pos_y + delta_y,
        ship_token_name: old_ship_datum.ship_token_name,
        pilot_token_name: old_ship_datum.pilot_token_name,
        tx_latest_posix_time: BigInt(upper_bound),
    };
    const pilot_token = AssetId(
        shipyard_policy + old_ship_datum.pilot_token_name,
    );
    const ship_token = AssetId(
        shipyard_policy + old_ship_datum.ship_token_name,
    );

    const new_ship_datum = Data.to(new_ship_data, ShipDatum);

    const moveShipRedeemer = Data.to(new Constr(0, [delta_x, delta_y]));
    const burnFuelRedeemer = Data.to(new Constr(1, []));

    const tx = blaze
        .newTransaction()
        .setValidFrom(Slot(lower_bound_slot))
        .setValidUntil(Slot(upper_bound_slot))
        .addReferenceInput(spacetime_ref_utxos[0])
        .addReferenceInput(pellet_ref_utxos[0])
        .addInput(pilot_utxo)
        .addInput(ship_utxo[0], moveShipRedeemer)
        .addMint(
            AssetId.getPolicyId(fuel_token),
            new Map([[AssetId.getAssetName(fuel_token), -spent_fuel]]),
            burnFuelRedeemer,
        )
        .lockAssets(
            spacetime_validator_address,
            makeValue(0n, [fuel_token, ship_fuel - spent_fuel], [
                ship_token,
                1n,
            ]),
            new_ship_datum,
        )
        .payAssets(blaze.wallet.address, makeValue(0n, [pilot_token, 1n]))
        .complete();
    return tx;
}

async function gatherFuel(
    provider: Kupmios,
    address: string,
    game_identifier: GameIdentifier,
): Promise<Transaction> {
    const blaze = await blazeInit(address, provider);

    const ship_input = outRefToTransactionInput(
        game_identifier.ship_utxo!,
    );
    const pellet_input = outRefToTransactionInput(
        game_identifier.pellet_utxo!,
    );

    const spacetime_ref_input = outRefToTransactionInput(
        game_identifier.spacetime_script_reference!,
    );

    const pellet_ref_input = outRefToTransactionInput(
        game_identifier.pellet_script_reference!,
    );

    const spacetime_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        spacetime_ref_input,
    ]);
    const pellet_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        pellet_ref_input,
    ]);

    const ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_input]);
    const pellet_utxos = await blaze.provider.resolveUnspentOutputs([
        pellet_input,
    ]);

    const spacetime_validator_address = spacetime_ref_utxos[0].output()
        .address();
    const pellet_validator_address = pellet_ref_utxos[0].output().address();

    const fuel_policy = extractPolicyIdFromAddress(pellet_validator_address);
    const fuel_assetName = "4655454C";
    const fuel_token = AssetId(fuel_policy + fuel_assetName);

    const shipyard_policy = extractPolicyIdFromAddress(
        spacetime_validator_address,
    );

    const utxos = await blaze.provider.getUnspentOutputs(blaze.wallet.address);

    const ship_datum = ship_utxo[0].output().datum()!.asInlineData()!;
    const old_ship_datum = Data.from(ship_datum, ShipDatum);
    const new_ship_datum = Data.to(old_ship_datum, ShipDatum);

    const pellet_datum = pellet_utxos[0].output().datum()!.asInlineData()!;
    const spacetime_ref_datum = spacetime_ref_utxos[0].output().datum()!
        .asInlineData()!;
    const spacetime_ref_datum_data = Data.from(
        spacetime_ref_datum,
        SpaceTimeScriptDatum,
    );

    const old_pellet_datum = Data.from(pellet_datum, PelletDatum);
    const new_pellet_datum = Data.to(old_pellet_datum, PelletDatum);

    let pilot_utxo: TransactionUnspentOutput = utxos[0];
    for (const utxo of utxos) {
        utxo.output().amount().multiasset()?.forEach(
            (value: bigint, asset: AssetId) => {
                if (
                    AssetId.getPolicyId(asset).toLowerCase() ==
                    shipyard_policy &&
                    AssetId.getAssetName(asset).toLowerCase() ==
                    old_ship_datum.pilot_token_name
                ) {
                    pilot_utxo = utxo;
                }
            },
        );
    }

    const pellet_ref_datum = pellet_ref_utxos[0].output().datum()!
        .asInlineData()!;
    const pellet_ref_datum_data = Data.from(
        pellet_ref_datum,
        PelletScriptDatum,
    );
    const admin_token_from_datum = pellet_ref_datum_data.admin_token;

    const admin_token = AssetId(
        admin_token_from_datum.policy_id + admin_token_from_datum.asset_name,
    );

    let ship_fuel = 0n;
    ship_utxo[0].output().amount().multiasset()?.forEach(
        (value: bigint, asset: AssetId) => {
            if (AssetId.getPolicyId(asset) == AssetId.getPolicyId(fuel_token)) {
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

    const query_tip_result = await blaze.provider.ogmios.queryNetworkTip();
    const network_tip = JSON.parse(JSON.stringify(query_tip_result));

    const lower_bound_slot = network_tip.slot;

    const tank_remaining_capacity = spacetime_ref_datum_data.max_ship_fuel -
        ship_fuel;
    let amount_to_gather = tank_remaining_capacity;
    if (tank_remaining_capacity > pellet_fuel) {
        amount_to_gather = pellet_fuel;
    }

    const gather_fuel_redeemer = Data.to(new Constr(1, [amount_to_gather]));
    const provide_fuel_redeemer = Data.to(new Constr(0, [amount_to_gather]));

    const pilot_token = AssetId(
        shipyard_policy + old_ship_datum.pilot_token_name,
    );
    const ship_token = AssetId(
        shipyard_policy + old_ship_datum.ship_token_name,
    );

    const pellet_change = pellet_fuel - amount_to_gather;
    let value_to_lock = makeValue(0n, [
        admin_token,
        1n,
    ])
    if (pellet_change > 0) {
        value_to_lock = makeValue(0n, [fuel_token, pellet_change], [
            admin_token,
            1n,
        ]);
    }
    const tx = blaze
        .newTransaction()
        .setValidFrom(Slot(lower_bound_slot))
        .addReferenceInput(spacetime_ref_utxos[0])
        .addReferenceInput(pellet_ref_utxos[0])
        .addInput(pilot_utxo)
        .addInput(ship_utxo[0], gather_fuel_redeemer)
        .addInput(pellet_utxos[0], provide_fuel_redeemer)
        .lockAssets(
            spacetime_validator_address,
            makeValue(0n, [fuel_token, ship_fuel + amount_to_gather], [
                ship_token,
                1n,
            ]),
            new_ship_datum,
        )
        .lockAssets(
            pellet_validator_address,
            value_to_lock,
            new_pellet_datum,
        )
        .payAssets(blaze.wallet.address, makeValue(0n, [pilot_token, 1n]))
        .complete();

    return tx;
}

async function mineAsteria(
    provider: Kupmios,
    address: string,
    game_identifier: GameIdentifier,
): Promise<Transaction> {
    const blaze = await blazeInit(address, provider);

    const asteria_ref_input = outRefToTransactionInput(
        game_identifier.asteria_script_reference!,
    );
    const spacetime_ref_input = outRefToTransactionInput(
        game_identifier.spacetime_script_reference!,
    );
    const pellet_ref_input = outRefToTransactionInput(
        game_identifier.pellet_script_reference!,
    );
    const ship_input = outRefToTransactionInput(game_identifier.ship_utxo!);

    const asteria_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        asteria_ref_input,
    ]);
    const spacetime_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        spacetime_ref_input,
    ]);
    const pellet_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        pellet_ref_input,
    ]);

    const ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_input]);

    const asteria_validator_address = asteria_ref_utxos[0].output().address();
    const spacetime_validator_address = spacetime_ref_utxos[0].output()
        .address();
    const pellet_validator_address = pellet_ref_utxos[0].output().address();

    const shipyard_policy = extractPolicyIdFromAddress(
        spacetime_validator_address,
    );

    const asteria_ref_datum = asteria_ref_utxos[0].output().datum()!
        .asInlineData()!;
    const asteria_ref_datum_data = Data.from(
        asteria_ref_datum,
        AsteriaScriptDatum,
    );
    const admin_token_from_datum = asteria_ref_datum_data.admin_token;

    const fuel_policy = extractPolicyIdFromAddress(pellet_validator_address);
    const fuel_assetName = "4655454C";
    const fuel_token = AssetId(fuel_policy + fuel_assetName);

    const admin_token = AssetId(
        admin_token_from_datum.policy_id + admin_token_from_datum.asset_name,
    );
    const asteria_utxos = await blaze.provider.getUnspentOutputsWithAsset(asteria_validator_address, admin_token);
    const asteria_datum = asteria_utxos[0].output().datum()!.asInlineData()!;

    const asteria_datum_data = Data.from(
        asteria_datum,
        AsteriaDatum,
    );

    const new_asteria_datum = Data.to(asteria_datum_data, AsteriaDatum);

    const ship_datum = ship_utxo[0].output().datum()!.asInlineData()!;
    const old_ship_datum = Data.from(ship_datum, ShipDatum);

    const ship_token = AssetId(
        shipyard_policy + old_ship_datum.ship_token_name,
    );
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

    const reward_percentage = Number(asteria_datum_data.max_asteria_mining) /
        100;
    const total_rewards = asteria_utxos[0].output().amount().coin();
    const user_reward = BigInt(Number(total_rewards) * reward_percentage);
    const remaining_rewards = total_rewards - user_reward;

    const network_tip_query = await blaze.provider.ogmios.queryNetworkTip();
    const network_tip = JSON.parse(JSON.stringify(network_tip_query));
    const lower_bound = network_tip.slot;

    const tx = blaze
        .newTransaction()
        .setValidFrom(Slot(lower_bound))
        .addReferenceInput(pellet_ref_utxos[0])
        .addReferenceInput(asteria_ref_utxos[0])
        .addReferenceInput(spacetime_ref_utxos[0])
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
        .payAssets(blaze.wallet.address, makeValue(0n, [pilot_token, 1n]))
        .complete();

    return tx;
}

async function quit(
    provider: Kupmios,
    address: string,
    game_identifier: GameIdentifier,
): Promise<Transaction> {
    const blaze = await blazeInit(address, provider);

    const ship_input = outRefToTransactionInput(
        game_identifier.ship_utxo!,
    );
    const spacetime_ref_input = outRefToTransactionInput(
        game_identifier.spacetime_script_reference!,
    );
    const pellet_ref_input = outRefToTransactionInput(
        game_identifier.pellet_script_reference!,
    );

    const ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_input]);

    const spacetime_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        spacetime_ref_input,
    ]);
    const pellet_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        pellet_ref_input,
    ]);

    const spacetime_validator_address = spacetime_ref_utxos[0].output()
        .address();
    const pellet_validator_address = pellet_ref_utxos[0].output().address();

    const ship_datum = ship_utxo[0].output().datum()!.asInlineData()!;
    const old_ship_datum = Data.from(ship_datum, ShipDatum);

    const fuel_policy = extractPolicyIdFromAddress(pellet_validator_address);
    const fuel_assetName = "4655454C";
    const fuel_token = AssetId(fuel_policy + fuel_assetName);

    const shipyard_policy = extractPolicyIdFromAddress(
        spacetime_validator_address,
    );
    const ship_asset_name = old_ship_datum.ship_token_name;
    const ship_token = AssetId(shipyard_policy + ship_asset_name);

    const utxos = await blaze.provider.getUnspentOutputs(blaze.wallet.address);
    let pilot_utxo: TransactionUnspentOutput = utxos[0];
    for (const utxo of utxos) {
        utxo.output().amount().multiasset()?.forEach(
            (value: bigint, asset: AssetId) => {
                if (
                    AssetId.getPolicyId(asset).toLowerCase() ==
                    shipyard_policy &&
                    AssetId.getAssetName(asset).toLowerCase() ==
                    old_ship_datum.pilot_token_name
                ) {
                    pilot_utxo = utxo;
                }
            },
        );
    }

    let ship_fuel = 0n;
    ship_utxo[0].output().amount().multiasset()?.forEach(
        (value: bigint, asset: AssetId) => {
            if (AssetId.getPolicyId(asset) == AssetId.getPolicyId(fuel_token)) {
                ship_fuel = value;
            }
        },
    );

    const quitRedeemer = Data.to(new Constr(3, []));
    const burnRedeemer = Data.to(new Constr(1, []));

    const tx = blaze
        .newTransaction()
        .addReferenceInput(spacetime_ref_utxos[0])
        .addReferenceInput(pellet_ref_utxos[0])
        .addInput(pilot_utxo)
        .addInput(ship_utxo[0], quitRedeemer)
        .addMint(
            AssetId.getPolicyId(fuel_token),
            new Map([[AssetId.getAssetName(fuel_token), -ship_fuel]]),
            burnRedeemer,
        )
        .addMint(
            AssetId.getPolicyId(ship_token),
            new Map([[AssetId.getAssetName(ship_token), -1n]]),
            burnRedeemer,
        )
        .complete();

    return tx;
}

export { createShip, gatherFuel, mineAsteria, moveShip, quit };
