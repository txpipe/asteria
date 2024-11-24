use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria/test_mock as mock
use asteria/types.{AssetClass, ConsumePellet, PelletDatum}
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{add, from_asset, from_lovelace, zero}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Spend, Transaction,
}
use pellet

// ==============================================================================================
// Consume Tests
// ==============================================================================================

type ConsumeTestOptions {
  is_wallet_address: Bool,
  includes_admin_input: Bool,
  burns_remaining_fuel: Bool,
}

fn default_consume_options() {
  ConsumeTestOptions {
    is_wallet_address: True,
    includes_admin_input: True,
    burns_remaining_fuel: True,
  }
}

fn consume(options: ConsumeTestOptions) -> Bool {
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = ConsumePellet

  let admin_address =
    Address {
      payment_credential: if options.is_wallet_address {
        VerificationKey(mock.admin_credential)
      } else {
        Script(mock.admin_credential)
      },
      stake_credential: None,
    }
  let admin_in = {
    let output = {
      let value =
        from_lovelace(2_000_000)
          |> add(admin_token.policy, admin_token.name, 1)
      Output {
        address: admin_address,
        value,
        datum: NoDatum,
        reference_script: None,
      }
    }
    let output_reference =
      OutputReference { transaction_id: mock.transaction_id_2, output_index: 0 }
    Input { output_reference, output }
  }

  let pellet_address =
    Address {
      payment_credential: Script(mock.pellet_credential),
      stake_credential: None,
    }
  let pellet_datum =
    PelletDatum { pos_x: 3, pos_y: -8, shipyard_policy: mock.shipyard_policy }
  let pellet_in = {
    let output =
      Output {
        address: pellet_address,
        value: from_lovelace(2_000_000)
          |> add(mock.admin_policy, mock.admin_token_name, 1)
          |> add(mock.pellet_credential, "FUEL", 20),
        datum: InlineDatum(pellet_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference { transaction_id: mock.transaction_id_1, output_index: 0 }
    Input { output_reference, output }
  }

  let tx =
    Transaction {
      inputs: if options.includes_admin_input {
        [admin_in, pellet_in]
      } else {
        [pellet_in]
      },
      reference_inputs: [],
      outputs: [],
      fee: 5_000,
      mint: if options.burns_remaining_fuel {
        from_asset(mock.pellet_credential, "FUEL", -20)
      } else {
        zero
      },
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
          Spend(
            OutputReference {
              transaction_id: mock.transaction_id_1,
              output_index: 0,
            },
          ),
          {
            let redeemer_data: Data = redeemer
            redeemer_data
          },
        ),
      ],
      datums: dict.empty
        |> dict.insert(
            mock.transaction_id_1,
            {
              let datum_data: Data = InlineDatum(pellet_datum)
              datum_data
            },
          ),
      id: mock.transaction_id_3,
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }
  let result =
    pellet.pellet.spend(
      admin_token,
      Some(pellet_datum),
      redeemer,
      OutputReference { transaction_id: mock.transaction_id_1, output_index: 0 },
      tx,
    )
  result
}

test consume_ok() {
  consume(default_consume_options())
}

test admin_token_at_script_address() fail {
  consume(
    ConsumeTestOptions { ..default_consume_options(), is_wallet_address: False },
  )
}

test no_admin_input() fail {
  consume(
    ConsumeTestOptions {
      ..default_consume_options(),
      includes_admin_input: False,
    },
  )
}
