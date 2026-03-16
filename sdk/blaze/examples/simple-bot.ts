import { Unwrapped } from "@blaze-cardano/ogmios";
import { Blaze, Data, HotWallet, Kupmios, Wallet } from "@blaze-cardano/sdk";
import { GameIdentifier, gatherFuel, moveShip, OutRef, outRefToTransactionInput, PelletDatum, PelletScriptDatum, ShipDatum, slotToUnix, SpaceTimeScriptDatum } from "../src";
import { mnemonicToEntropy, wordlist, Bip32PrivateKey, TransactionId, TransactionInput, AssetId, TransactionUnspentOutput } from "@blaze-cardano/core";
import { SEED } from "../secret";


async function waitForTransaction(provider: Kupmios, wallet: Wallet, txId: TransactionId) {
    const blaze = await Blaze.from(provider, wallet);
    console.log("Waiting for transaction to be confirmed");
    while (true) {
        try {
            delay(5000);
            await blaze.provider.resolveUnspentOutputs([new TransactionInput(txId, 0n)]);
            console.log("Transaction confirmed: " + txId);
            break;
        } catch (error) {
        }
    }
}
async function waitForMoveCooldown(provider: Kupmios, wallet: Wallet, slot_to_wait_unix: number) {
    const blaze = await Blaze.from(provider, wallet);
    console.log("Waiting for move cooldown");
    while (true) {
        const query_tip_result = await blaze.provider.ogmios.queryNetworkTip();
        const network_tip = JSON.parse(JSON.stringify(query_tip_result));
        const current_slot = network_tip.slot;
        const current_slot_unix = slotToUnix(current_slot);
        if (current_slot_unix > slot_to_wait_unix) {
            break;
        }
        delay(5000);
    }
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const address =
        "addr_test1qzjpgxkhe06gxzstfhywg02ggy5ltuwne6mfr406dlf0mpwp9a07r34cwsnkpn44tllxuydw4wp0xvstw5jqv5q9lszsk2qynn";

    const provider = new Kupmios(
        process.env.KUPO_URL!,
        await Unwrapped.Ogmios.new(process.env.OGMIOS_URL!)
    );
    const mnemonic = process.env.SEED!;
    const entropy = mnemonicToEntropy(mnemonic, wordlist);
    const masterkey = Bip32PrivateKey.fromBip39Entropy(Buffer.from(entropy), "");
    const wallet = await HotWallet.fromMasterkey(masterkey.hex(), provider);

    const blaze = await Blaze.from(provider, wallet);

    const spacetime_script_reference: OutRef = {
        tx_hash:
            "41e5881cd3bdc3f08bcf341796347e9027e3bcd8d58608b4fcfca5c16cbf5921",
        tx_index: 0n,
    };

    const pellet_script_reference: OutRef = {
        tx_hash:
            "ba6fab625d70a81f5d1b699e7efde4b74922d06224bef1f6b84f3adf0a61f3f3",
        tx_index: 0n,
    };

    let ship_utxo_outref: OutRef = {
        tx_hash:
            "e843ffaca1054f1822b9228bd82d658b246619477713cb520282c288dd20c895",
        tx_index: 0n,
    };

    const spacetime_ref_input = outRefToTransactionInput(
        spacetime_script_reference,
    );

    const pellet_ref_input = outRefToTransactionInput(pellet_script_reference);

    const spacetime_ref_utxos = await blaze.provider.resolveUnspentOutputs([
        spacetime_ref_input,
    ]);
    const pellet_ref_utxos = await blaze.provider.resolveUnspentOutputs([pellet_ref_input]);

    const spacetime_ref_datum = spacetime_ref_utxos[0].output().datum()!
        .asInlineData()!;
    const spacetime_ref_datum_data = Data.from(
        spacetime_ref_datum,
        SpaceTimeScriptDatum,
    );

    const pellet_validator_address = pellet_ref_utxos[0].output().address();
    const fuel_policy = "fc8ad4f84181b85dc04f7b8c2984b129284c4e272ef45cd6440575fd";
    const fuel_assetName = "4655454C";
    const fuel_token = AssetId(fuel_policy + fuel_assetName);
    let has_to_wait = false;
    while (true) {
        const ship_utxo = outRefToTransactionInput(ship_utxo_outref);

        const resolved_ship_utxo = await blaze.provider.resolveUnspentOutputs([ship_utxo]);

        const ship_datum = resolved_ship_utxo[0].output().datum()!.asInlineData()!;
        const ship_datum_data = Data.from(ship_datum, ShipDatum);

        const ship_pos_x = ship_datum_data.pos_x;
        const ship_pos_y = ship_datum_data.pos_y;

        const slot_to_wait = Number(ship_datum_data.tx_latest_posix_time);
        if (has_to_wait) {
            await waitForMoveCooldown(provider, wallet, slot_to_wait);
        }
        console.log("Ship position: ");
        console.log("pos_x: ", ship_pos_x);
        console.log("pos_y: ", ship_pos_y);

        if (ship_pos_x == 0 && ship_pos_y == 0) {
            console.log("Your ship has reached asteria");
            break;
        }

        let ship_fuel = 0n;
        resolved_ship_utxo[0].output().amount().multiasset()?.forEach(
            (value: any, key: any) => {
                if (AssetId.getPolicyId(key) == AssetId.getPolicyId(fuel_token)) {
                    ship_fuel = value;
                }
            },
        );
        let delta_x = -1n;
        let delta_y = -1n;

        if (ship_pos_x < 0) {
            delta_x = 1n;
        }
        if (ship_pos_y < 0) {
            delta_y = 1n;
        }

        if (ship_pos_x == 0) {
            delta_x = 0n;
        } else if (ship_pos_y == 0) {
            delta_y = 0n;
        }

        const distance = BigInt(
            Math.abs(Number(delta_x)) + Math.abs(Number(delta_y)),
        );

        const spent_fuel = distance * spacetime_ref_datum_data.fuel_per_step;
        const fuels = await blaze.provider.getUnspentOutputsWithAsset(pellet_validator_address, fuel_token);
        let fuel_utxo: TransactionUnspentOutput = fuels[0];
        let hasNearbyPellet = false;
        fuels.forEach((fuel) => {
            const fuel_datum = fuel.output().datum()!.asInlineData()!;
            const fuel_datum_data = Data.from(fuel_datum, PelletDatum);
            const fuel_pos_x = fuel_datum_data.pos_x;
            const fuel_pos_y = fuel_datum_data.pos_y;
            const isFuelPresent = ship_pos_x == fuel_pos_x && ship_pos_y == fuel_pos_y;
            if (isFuelPresent) {
                fuel_utxo = fuel;
                hasNearbyPellet = true;
            }
        });
        if (hasNearbyPellet == false) {
            if (ship_fuel < spent_fuel) {
                console.log("Ship has no fuel and there is no nearby pellets");
                break;
            }
        } else {
            console.log("There is a pellet nearby");
            console.log("Gathering fuel...")
            const fuel_utxo_outref: OutRef = {
                tx_hash: fuel_utxo.input().transactionId(),
                tx_index: fuel_utxo.input().index(),
            }
            const gather_fuel_identifier: GameIdentifier = {
                ship_utxo: ship_utxo_outref,
                pellet_utxo: fuel_utxo_outref,
                spacetime_script_reference,
                pellet_script_reference,
            };
            const tx = await gatherFuel(
                provider,
                address,
                gather_fuel_identifier,
            );

            const signedTx = await blaze.signTransaction(tx);
            const txId = await blaze.provider.postTransactionToChain(signedTx);

            ship_utxo_outref = {
                tx_hash: txId,
                tx_index: 0n,
            }
            await waitForTransaction(provider, wallet, txId);
            continue;
        }
        const move_ship_identifier: GameIdentifier = {
            ship_utxo: ship_utxo_outref,
            spacetime_script_reference,
            pellet_script_reference,
        };
        const tx = await moveShip(
            provider,
            address,
            move_ship_identifier,
            delta_x,
            delta_y,
        );

        const signedTx = await blaze.signTransaction(tx);
        const txId = await blaze.provider.postTransactionToChain(signedTx);

        ship_utxo_outref = {
            tx_hash: txId,
            tx_index: 0n,
        }
        has_to_wait = true;
        await waitForTransaction(provider, wallet, txId);
        console.log("Ship has moved");
    }

}
main().then(() => { });