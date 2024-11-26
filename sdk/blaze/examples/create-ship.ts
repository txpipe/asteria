import { createShip } from "../src";
import { GameIdentifier, OutRef } from "../src/types";
import { blazeInit } from "../src/utils";

async function main() {
    const address =
        "addr_test1qzjpgxkhe06gxzstfhywg02ggy5ltuwne6mfr406dlf0mpwp9a07r34cwsnkpn44tllxuydw4wp0xvstw5jqv5q9lszsk2qynn";
    const admin_token_subject =
        "d37ec8944834e0ce98d655820e05a2d0215b725fd2b79562128f79fa417374657269612041646d696e";

    const asteria_utxo: OutRef = {
        tx_hash:
            "d9ff22f22c0465bb4d719e0daf542e4c4aedf7af5c469b0912412119aac703c2",
        tx_index: 0n,
    };

    const spacetime_script_reference: OutRef = {
        tx_hash:
            "b19cb2b6a6cc0f435ef454665cdd437496070bdb6aedebe0f6260037a0f5b257",
        tx_index: 0n,
    };

    const pellet_script_reference: OutRef = {
        tx_hash:
            "c6408f164e408783963c202dcbf15d8a3fcd10a1263594fb091763df1014cad2",
        tx_index: 0n,
    };

    const asteria_script_reference: OutRef = {
        tx_hash:
            "a2023fce7f76fc87e464a7d7507d720842d93d63291adb84a254c268c56f72b3",
        tx_index: 0n,
    };

    

    const ship_mint_fee = 1000000n;
    const initial_fuel = 480n;
    const pos_x = 20n;
    const pos_y = 30n;

    const gameIdentifier: GameIdentifier = {
        admin_token_subject,
        ship_mint_fee,
        initial_fuel,
        asteria_utxo,
        spacetime_script_reference,
        pellet_script_reference,
        asteria_script_reference,
    };

    const tx = await createShip(
        address,
        gameIdentifier,
        pos_x,
        pos_y,
    );

    return tx;
}

main().then((tx) => {
    console.log(tx.toCbor());
});