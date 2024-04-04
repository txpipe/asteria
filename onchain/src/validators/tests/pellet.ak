use aiken/bytearray
use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, ScriptContext, Spend,
  Transaction, TransactionId,
}
use aiken/transaction/credential.{Address, ScriptCredential}
use aiken/transaction/value.{
  PolicyId, Value, add, from_lovelace, without_lovelace, zero,
}
use asteria/test_utils
use asteria/types.{AssetClass, PelletDatum, Provide}
use pellet as pellet_validator

// ==============================================================================================
// Provide Tests
// ==============================================================================================

type ProvideTestOptions {
  initial_fuel: Int,
  provided_amount: Int,
  pellet_input_value: Value,
  pellet_output_value: Value,
  admin_policy: PolicyId,
  admin_token_name: ByteArray,
  shipyard_policy: PolicyId,
  ship_token_name: ByteArray,
  ship_token_amount: Int,
  datum_out: PelletDatum,
}

fn default_provide_test_options() -> ProvideTestOptions {
  let shipyard_policy =
    #"0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005"
  let admin_policy = #"0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2004"
  let admin_token_name = "admin"
  let value =
    from_lovelace(2_000_000)
      |> add(admin_policy, admin_token_name, 1)
  ProvideTestOptions {
    initial_fuel: 40,
    provided_amount: 15,
    pellet_input_value: value,
    pellet_output_value: value,
    admin_policy,
    admin_token_name,
    shipyard_policy,
    ship_token_name: "SHIP23",
    ship_token_amount: 1,
    datum_out: PelletDatum { fuel: 25, pos_x: 1, pos_y: 2, shipyard_policy },
  }
}

fn provide(options: ProvideTestOptions) -> Bool {
  let pellet_addr = #"6af53ff4f054348ad825c692dd9db8f1760a8e0eacf9af9f99306513"
  let ship_addr = #"6af53ff4f054348ad825c692dd9db8f1760a8e0eacf9af9f99306514"
  let admin_asset =
    AssetClass { policy: options.admin_policy, name: options.admin_token_name }
  let transaction_id_1 =
    #"6dcd4ce23d88e2ee95838f4b759b3456c63d219231a64a3ce6dd2bf72f5c5b6a"
  let transaction_id_2 =
    #"6dcd4ce23d88e2ee95838f4b759b3456c63d219231a64a3ce6dd2bf72f5c5b6b"
  let redeemer = Provide(options.provided_amount)
  let datum_in =
    PelletDatum {
      fuel: options.initial_fuel,
      pos_x: 1,
      pos_y: 2,
      shipyard_policy: options.shipyard_policy,
    }
  let pellet_in = {
    let output = {
      let address =
        Address {
          payment_credential: ScriptCredential(pellet_addr),
          stake_credential: None,
        }
      let value = options.pellet_input_value
      Output {
        address,
        value,
        datum: InlineDatum(datum_in),
        reference_script: None,
      }
    }
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: transaction_id_1 },
        output_index: 0,
      },
      output,
    }
  }
  let ship_in = {
    let output = {
      let address =
        Address {
          payment_credential: ScriptCredential(ship_addr),
          stake_credential: None,
        }
      let value =
        from_lovelace(2_000_000)
          |> add(
              options.shipyard_policy,
              options.ship_token_name,
              options.ship_token_amount,
            )
      Output { address, value, datum: NoDatum, reference_script: None }
    }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: transaction_id_2 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pellet_out = {
    let address =
      Address {
        payment_credential: ScriptCredential(pellet_addr),
        stake_credential: None,
      }
    let value = options.pellet_output_value
    Output {
      address,
      value,
      datum: InlineDatum(options.datum_out),
      reference_script: None,
    }
  }
  let ship_out = {
    let address =
      Address {
        payment_credential: ScriptCredential(ship_addr),
        stake_credential: None,
      }
    let value =
      from_lovelace(2_000_000)
        |> add(options.shipyard_policy, options.ship_token_name, 1)
    Output { address, value, datum: NoDatum, reference_script: None }
  }
  let tx =
    Transaction {
      inputs: [ship_in, pellet_in],
      reference_inputs: [],
      outputs: [ship_out, pellet_out],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(zero()),
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound { bound_type: Finite(1), is_inclusive: True },
        upper_bound: IntervalBound {
          bound_type: Finite(10),
          is_inclusive: True,
        },
      },
      extra_signatories: [],
      redeemers: dict.new()
        |> dict.insert(
            key: Spend(
              OutputReference {
                transaction_id: TransactionId { hash: transaction_id_1 },
                output_index: 0,
              },
            ),
            value: {
              let redeemer_data: Data = redeemer
              redeemer_data
            },
            compare: test_utils.script_purpose_compare,
          ),
      datums: dict.new()
        |> dict.insert(
            transaction_id_1,
            {
              let datum_data: Data = InlineDatum(datum_in)
              datum_data
            },
            compare: bytearray.compare,
          ),
      id: TransactionId { hash: transaction_id_1 },
    }
  let spend_ctx =
    ScriptContext {
      transaction: tx,
      purpose: Spend(
        OutputReference {
          transaction_id: TransactionId { hash: transaction_id_1 },
          output_index: 0,
        },
      ),
    }
  let result =
    pellet_validator.spend(admin_asset, datum_in, redeemer, spend_ctx)
  result
}

test provide_ok() {
  provide(default_provide_test_options())
}

test not_enough_fuel() fail {
  let options =
    ProvideTestOptions { ..default_provide_test_options(), provided_amount: 60 }
  provide(options)
}

test wrong_datum_update() fail {
  let default = default_provide_test_options()
  let options =
    ProvideTestOptions {
      ..default,
      datum_out: PelletDatum { ..default.datum_out, fuel: 1000 },
    }
  provide(options)
}

test no_ship_token() fail {
  let options =
    ProvideTestOptions {
      ..default_provide_test_options(),
      ship_token_amount: 0,
    }
  provide(options)
}

test wrong_ship_token_name() fail {
  let options =
    ProvideTestOptions {
      ..default_provide_test_options(),
      ship_token_name: "SHI23",
    }
  provide(options)
}

test no_admin_token() fail {
  let options =
    ProvideTestOptions {
      ..default_provide_test_options(),
      pellet_input_value: from_lovelace(2_000_000),
      pellet_output_value: from_lovelace(2_000_000),
    }
  provide(options)
}

test wrong_value_update() fail {
  let default = default_provide_test_options()
  let options =
    ProvideTestOptions {
      ..default_provide_test_options(),
      pellet_output_value: without_lovelace(default.pellet_input_value),
    }
  provide(options)
}
