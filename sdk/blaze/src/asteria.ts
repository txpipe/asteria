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
import {  AsteriaDatum, GameIdentifier, ShipDatum } from "./types";

async function createShip(
    address: string,
    gameIdentifier: GameIdentifier,
    pos_x: bigint,
    pos_y: bigint,
): Promise<Transaction> {
    const blaze = await blazeInit(address);

    const spacetime_ref_input = outRefToTransactionInput(
        gameIdentifier.spacetime_script_reference,
    );
    const pellet_ref_input = outRefToTransactionInput(
        gameIdentifier.pellet_script_reference,
    );
    const asteria_ref_input = outRefToTransactionInput(
        gameIdentifier.asteria_script_reference,
    );
    const asteria_input = outRefToTransactionInput(gameIdentifier.asteria_utxo);

    const asteria_utxos = await blaze.provider.resolveUnspentOutputs([
        asteria_input,
    ]);

    const ref_utxos = await blaze.provider.resolveUnspentOutputs([
        asteria_ref_input,
        pellet_ref_input,
        spacetime_ref_input,
    ]);

    const asteria_datum = asteria_utxos[0].output().datum()!.asInlineData()!;

    const asteria_validator_address = ref_utxos[0].output().address();
    const pellet_validator_address = ref_utxos[1].output().address();
    const spacetime_validator_address = ref_utxos[2].output().address();

    const shipyard_policy = extractPolicyIdFromAddress(
        spacetime_validator_address,
    );

    const fuel_policy = extractPolicyIdFromAddress(pellet_validator_address);
    const fuel_assetName = "4655454C";
    const fuel_token = AssetId(fuel_policy + fuel_assetName);

    const admin_token = subjectToAssetId(gameIdentifier.admin_token_subject);

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

    const total_rewards = asteria_utxos[0].output().amount().coin() + gameIdentifier.ship_mint_fee;

    

    const query_tip_result = await blaze.provider.ogmios.queryNetworkTip();
    const network_tip =JSON.parse(JSON.stringify(query_tip_result));
    const latest_slot = network_tip.slot;
    const adjusted_slot = Slot(latest_slot + 100);
    const tx_latest_posix_time = slotToUnix(adjusted_slot);

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
        .setValidUntil(Slot(adjusted_slot))
        .addReferenceInput(ref_utxos[0])
        .addReferenceInput(ref_utxos[1])
        .addReferenceInput(ref_utxos[2])
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
                gameIdentifier.initial_fuel,
            ]),
            ship_datum,
        )
        .addMint(
            AssetId.getPolicyId(fuel_token),
            new Map([[AssetId.getAssetName(fuel_token), gameIdentifier.initial_fuel]]),
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

async function moveShip() {
}

async function gatherFuel() {
}

async function mineAsteria() {
}

async function quit() {
}

export { createShip, gatherFuel, mineAsteria, moveShip, quit };
