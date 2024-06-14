use aiken/bytearray
use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, ScriptContext, Spend,
  Transaction, TransactionId,
}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value.{PolicyId, Value, add, from_lovelace, zero}
use asteria/test_mock as mock
use asteria/test_utils
use asteria/types.{AssetClass, ConsumePellet, PelletDatum, Provide}
use pellet

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
  datum_in: PelletDatum,
  datum_out: PelletDatum,
}

fn default_provide_test_options() -> ProvideTestOptions {
  let initial_fuel = 40
  let provided_amount = 15
  let pellet_input_value =
    from_lovelace(2_000_000)
      |> add(mock.admin_policy, mock.admin_token_name, 1)
      |> add(mock.pellet_credential, "FUEL", initial_fuel)
  let pellet_output_value =
    from_lovelace(2_000_000)
      |> add(mock.admin_policy, mock.admin_token_name, 1)
      |> add(mock.pellet_credential, "FUEL", initial_fuel - provided_amount)
  let pellet_datum =
    PelletDatum { pos_x: 1, pos_y: 2, shipyard_policy: mock.shipyard_policy }
  ProvideTestOptions {
    initial_fuel,
    provided_amount,
    pellet_input_value,
    pellet_output_value,
    admin_policy: mock.admin_policy,
    admin_token_name: mock.admin_token_name,
    shipyard_policy: mock.shipyard_policy,
    ship_token_name: mock.ship_token_name,
    ship_token_amount: 1,
    datum_in: pellet_datum,
    datum_out: pellet_datum,
  }
}

fn provide(options: ProvideTestOptions) -> Bool {
  let admin_asset =
    AssetClass { policy: options.admin_policy, name: options.admin_token_name }
  let transaction_id_1 = mock.transaction_id_1
  let transaction_id_2 = mock.transaction_id_2
  let redeemer = Provide(options.provided_amount)
  let datum_in = options.datum_in
  let pellet_in = {
    let output = {
      let address =
        Address {
          payment_credential: ScriptCredential(mock.pellet_credential),
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
          payment_credential: ScriptCredential(mock.ship_credential),
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
        payment_credential: ScriptCredential(mock.pellet_credential),
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
        payment_credential: ScriptCredential(mock.ship_credential),
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
  let result = pellet.spend(admin_asset, datum_in, redeemer, spend_ctx)
  result
}

test provide_ok() {
  provide(default_provide_test_options())
}

test provide_no_ship_token() fail {
  let options =
    ProvideTestOptions {
      ..default_provide_test_options(),
      ship_token_amount: 0,
    }
  provide(options)
}

test provide_wrong_ship_token_name() fail {
  let options =
    ProvideTestOptions {
      ..default_provide_test_options(),
      ship_token_name: "SHI7",
    }
  provide(options)
}

test provide_no_admin_token_output() fail {
  let options =
    ProvideTestOptions {
      ..default_provide_test_options(),
      pellet_output_value: from_lovelace(2_000_000),
    }
  provide(options)
}

test provide_not_enough_fuel() fail {
  let options =
    ProvideTestOptions { ..default_provide_test_options(), provided_amount: 60 }
  provide(options)
}

test provide_fuel_not_subtracted() fail {
  let default_options = default_provide_test_options()
  let options =
    ProvideTestOptions {
      ..default_options,
      pellet_output_value: default_options.pellet_input_value,
    }
  provide(options)
}

test provide_datum_not_preserved() fail {
  let default_options = default_provide_test_options()
  let datum_in = default_options.datum_in
  let options =
    ProvideTestOptions {
      ..default_options,
      datum_out: PelletDatum { ..datum_in, pos_x: datum_in.pos_x + 1 },
    }
  provide(options)
}

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
        VerificationKeyCredential(mock.admin_credential)
      } else {
        ScriptCredential(mock.admin_credential)
      },
      stake_credential: None,
    }
  let admin_in = {
    let output = {
      let value =
        value.from_lovelace(2_000_000)
          |> value.add(admin_token.policy, admin_token.name, 1)
      Output {
        address: admin_address,
        value,
        datum: NoDatum,
        reference_script: None,
      }
    }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_2 },
        output_index: 0,
      }
    Input { output_reference, output }
  }

  let pellet_address =
    Address {
      payment_credential: ScriptCredential(mock.pellet_credential),
      stake_credential: None,
    }
  let pellet_datum =
    PelletDatum { pos_x: 3, pos_y: -8, shipyard_policy: mock.shipyard_policy }
  let pellet_in = {
    let output =
      Output {
        address: pellet_address,
        value: value.from_lovelace(2_000_000)
          |> value.add(mock.admin_policy, mock.admin_token_name, 1)
          |> value.add(mock.pellet_credential, "FUEL", 20),
        datum: InlineDatum(pellet_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
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
      fee: value.from_lovelace(5_000),
      mint: if options.burns_remaining_fuel {
        value.to_minted_value(
          value.from_asset(mock.pellet_credential, "FUEL", -20),
        )
      } else {
        value.to_minted_value(value.zero())
      },
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
                transaction_id: TransactionId { hash: mock.transaction_id_1 },
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
            mock.transaction_id_1,
            {
              let datum_data: Data = InlineDatum(pellet_datum)
              datum_data
            },
            compare: bytearray.compare,
          ),
      id: TransactionId { hash: mock.transaction_id_3 },
    }
  let spend_ctx =
    ScriptContext {
      transaction: tx,
      purpose: Spend(
        OutputReference {
          transaction_id: TransactionId { hash: mock.transaction_id_1 },
          output_index: 0,
        },
      ),
    }
  let result = pellet.spend(admin_token, pellet_datum, redeemer, spend_ctx)
  result
}

test consume_ok() {
  consume(default_consume_options())
}

test consume_admin_token_from_script_address() fail {
  consume(
    ConsumeTestOptions { ..default_consume_options(), is_wallet_address: False },
  )
}

test consume_no_admin_input() fail {
  consume(
    ConsumeTestOptions {
      ..default_consume_options(),
      includes_admin_input: False,
    },
  )
}

test consume_remaining_fuel_not_burnt() fail {
  consume(
    ConsumeTestOptions {
      ..default_consume_options(),
      burns_remaining_fuel: False,
    },
  )
}
