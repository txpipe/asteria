use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria/test_mock as mock
use asteria/types.{AssetClass, MintFuel}
use cardano/address.{Address, VerificationKey}
use cardano/assets.{add, from_asset, from_lovelace}
use cardano/transaction.{
  Input, Mint, NoDatum, Output, OutputReference, Transaction,
}
use pellet

// ==============================================================================================
// MintFuel Tests
// ==============================================================================================

type MintTestOptions {
  fuel_tokens_minted: Int,
  includes_admin_input: Bool,
}

fn get_default_mint_options() {
  MintTestOptions { fuel_tokens_minted: 20, includes_admin_input: True }
}

fn mint_fuel(options: MintTestOptions) -> Bool {
  let redeemer = MintFuel
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let admin_address =
    Address {
      payment_credential: VerificationKey(mock.admin_credential),
      stake_credential: None,
    }
  let admin_input = {
    let output = {
      let value =
        from_lovelace(2_000_000)
          |> add(mock.admin_policy, mock.admin_token_name, 1)
      Output {
        address: admin_address,
        value,
        datum: NoDatum,
        reference_script: None,
      }
    }
    Input {
      output_reference: OutputReference {
        transaction_id: mock.transaction_id_1,
        output_index: 0,
      },
      output,
    }
  }
  let tx =
    Transaction {
      inputs: if options.includes_admin_input {
        [admin_input]
      } else {
        []
      },
      reference_inputs: [],
      outputs: [],
      fee: 5_000,
      mint: from_asset(mock.fuel_policy, "FUEL", options.fuel_tokens_minted),
      certificates: [],
      withdrawals: [],
      validity_range: Interval {
        lower_bound: IntervalBound { bound_type: Finite(1), is_inclusive: True },
        upper_bound: IntervalBound {
          bound_type: Finite(10),
          is_inclusive: True,
        },
      },
      extra_signatories: [],
      redeemers: [
        Pair(
          Mint(mock.fuel_policy),
          {
            let redeemer_data: Data = redeemer
            redeemer_data
          },
        ),
      ],
      datums: dict.empty,
      id: mock.transaction_id_2,
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }
  let result = pellet.pellet.mint(admin_token, redeemer, mock.fuel_policy, tx)
  result
}

test mint_ok() {
  mint_fuel(get_default_mint_options())
}

test no_fuel_tokens_minted() fail {
  mint_fuel(
    MintTestOptions { ..get_default_mint_options(), fuel_tokens_minted: 0 },
  )
}

test no_admin_input() fail {
  mint_fuel(
    MintTestOptions {
      ..get_default_mint_options(),
      includes_admin_input: False,
    },
  )
}
