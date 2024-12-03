import { GameIdentifier, OutRef } from "../src/types";
import { gatherFuel } from "../src";
import { Unwrapped } from "@blaze-cardano/ogmios";
import { Kupmios } from "@blaze-cardano/sdk";

async function main() {
    const address =
        "addr_test1qzjpgxkhe06gxzstfhywg02ggy5ltuwne6mfr406dlf0mpwp9a07r34cwsnkpn44tllxuydw4wp0xvstw5jqv5q9lszsk2qynn";

    const provider = new Kupmios(
        process.env.KUPO_URL!,
        await Unwrapped.Ogmios.new(process.env.OGMIOS_URL!)
    );


    const ship_utxo: OutRef = {
        tx_hash:
            "3e04a7a3e4a1015705c44822feaf5f2da1e9609eebd68310c87b7eba7923739a",
        tx_index: 0n,
    };
    const pellet_utxo: OutRef = {
        tx_hash:
            "22af0198b4e6e9c8306392c7ac0ea97b8a2f659a6312708b22b7717805554b97",
        tx_index: 0n,
    };

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


    const gather_fuel_identifier: GameIdentifier = {
        ship_utxo,
        pellet_utxo,
        spacetime_script_reference,
        pellet_script_reference,
    };

    const tx = await gatherFuel(
        provider,
        address,
        gather_fuel_identifier,
    );

    return tx;
}

main().then((tx) => {
    console.log(tx.toCbor());
});
