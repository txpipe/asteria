import { createShip, moveShip, quit } from "../src";
import { OutRef, GameIdentifier } from "../src/types";

async function main() {
    const address =
        "addr_test1qzjpgxkhe06gxzstfhywg02ggy5ltuwne6mfr406dlf0mpwp9a07r34cwsnkpn44tllxuydw4wp0xvstw5jqv5q9lszsk2qynn";

    const ship_utxo: OutRef = {
        tx_hash:
            "870b37da4cc82a16eb47db293713d81fe9abfe183055341174405e94768264c5",
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

   

    const quit_game_identifier: GameIdentifier = {
        ship_utxo,
        spacetime_script_reference,
        pellet_script_reference,
    };

    const tx = await quit(
        address,
        quit_game_identifier,
    );

    return tx;
}

main().then((tx) => {
    console.log(tx.toCbor());
});