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
use aiken/transaction/value.{
  ada_asset_name, ada_policy_id, add, from_lovelace, zero,
}
use asteria/test_utils
use asteria/types.{AssetClass, MoveShip, ShipDatum}
use asteria/utils.{distance}
use spacetime

// ==============================================================================================
// MoveShip Tests
// ==============================================================================================

type MoveTestOptions {
  delta_x: Int,
  delta_y: Int,
  initial_fuel: Int,
  include_ship_token: Bool,
  include_ship_input: Bool,
  include_ship_output: Bool,
  include_pilot_token: Bool,
  preserve_value: Bool,
  preserve_pilot_token: Bool,
  update_x: Bool,
  update_y: Bool,
  update_fuel: Bool,
}

fn default_move_options() {
  MoveTestOptions {
    delta_x: 10,
    delta_y: 10,
    initial_fuel: 40,
    include_ship_token: True,
    include_ship_input: True,
    include_ship_output: True,
    include_pilot_token: True,
    preserve_value: True,
    preserve_pilot_token: True,
    update_x: True,
    update_y: True,
    update_fuel: True,
  }
}

fn move(options: MoveTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let max_distance = 30
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_x = -20
  let initial_y = -20
  let shipyard_policy = #"c000"
  let ship_credential = #"0000"
  let pellet_credential = #"1111"
  let asteria_credential = #"2222"
  let pilot_credential = #"3333"
  let transaction_id_1 = #"a111"
  let transaction_id_2 = #"a222"
  let transaction_id_3 = #"a333"
  let ship_token_name = "SHIP23"
  let pilot_token_name = "PILOT23"
  let admin_policy = #"c111"
  let admin_token_name = "admin"
  let admin_token = AssetClass { policy: admin_policy, name: admin_token_name }
  let redeemer = MoveShip(options.delta_x, options.delta_y)
  let pilot_address =
    Address {
      payment_credential: VerificationKeyCredential(pilot_credential),
      stake_credential: None,
    }
  let asteria_address =
    Address {
      payment_credential: ScriptCredential(asteria_credential),
      stake_credential: None,
    }
  let pellet_address =
    Address {
      payment_credential: ScriptCredential(pellet_credential),
      stake_credential: None,
    }
  let ship_address =
    Address {
      payment_credential: ScriptCredential(ship_credential),
      stake_credential: None,
    }
  let ship_value =
    if options.include_ship_token {
      min_ada
        |> add(shipyard_policy, ship_token_name, 1)
    } else {
      min_ada
    }
  let ship_datum_in =
    ShipDatum {
      fuel: options.initial_fuel,
      pos_x: initial_x,
      pos_y: initial_y,
      shipyard_policy,
      ship_token_name,
      pilot_token_name,
    }
  let ship_datum_out =
    ShipDatum {
      fuel: if options.update_fuel {
        options.initial_fuel - fuel_per_step * distance(
          options.delta_x,
          options.delta_y,
        )
      } else {
        options.initial_fuel
      },
      pos_x: if options.update_x {
        initial_x + options.delta_x
      } else {
        initial_x
      },
      pos_y: if options.update_y {
        initial_y + options.delta_y
      } else {
        initial_y
      },
      shipyard_policy,
      ship_token_name,
      pilot_token_name: if options.preserve_pilot_token {
        pilot_token_name
      } else {
        "FOO"
      },
    }
  let ship_in = {
    let output =
      Output {
        address: ship_address,
        value: ship_value,
        datum: InlineDatum(ship_datum_in),
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_in = {
    let output = {
      let value =
        if options.include_pilot_token {
          min_ada
            |> add(shipyard_policy, pilot_token_name, 1)
        } else {
          min_ada
        }
      Output {
        address: pilot_address,
        value,
        datum: NoDatum,
        reference_script: None,
      }
    }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: transaction_id_1 },
        output_index: 1,
      }
    Input { output_reference, output }
  }
  let asteria_in = {
    let output = {
      let value = min_ada
      Output {
        address: asteria_address,
        value,
        datum: NoDatum,
        reference_script: None,
      }
    }
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: transaction_id_2 },
        output_index: 0,
      },
      output,
    }
  }
  let ship_out =
    Output {
      address: ship_address,
      value: if options.preserve_value {
        ship_value
      } else {
        ship_value |> add(ada_policy_id, ada_asset_name, 1)
      },
      datum: InlineDatum(ship_datum_out),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: if options.include_ship_input {
        [ship_in, pilot_in, asteria_in]
      } else {
        [pilot_in, asteria_in]
      },
      reference_inputs: [],
      outputs: if options.include_ship_output {
        [ship_out]
      } else {
        []
      },
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
             transaction_id_2,
             {
               let datum_data: Data = InlineDatum(ship_datum_in)
               datum_data
             },
             compare: bytearray.compare,
           ),
      id: TransactionId { hash: transaction_id_3 },
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
    spacetime.spend(
      pellet_address,
      asteria_address,
      admin_token,
      max_distance,
      max_ship_fuel,
      fuel_per_step,
      ship_datum_in,
      redeemer,
      spend_ctx,
    )
  result
}

test move_ok() {
  move(default_move_options())
}

test no_ship_token() fail {
  move(MoveTestOptions { ..default_move_options(), include_ship_token: False })
}

test no_ship_input() fail {
  move(MoveTestOptions { ..default_move_options(), include_ship_input: False })
}

test no_ship_output() fail {
  move(MoveTestOptions { ..default_move_options(), include_ship_output: False })
}

test no_pilot_token() fail {
  move(MoveTestOptions { ..default_move_options(), include_pilot_token: False })
}

test not_enough_fuel() fail {
  move(MoveTestOptions { ..default_move_options(), initial_fuel: 5 })
}

test alter_ship_value() fail {
  move(MoveTestOptions { ..default_move_options(), preserve_value: False })
}

test alter_pilot_token() fail {
  move(
    MoveTestOptions { ..default_move_options(), preserve_pilot_token: False },
  )
}

test no_update_x() fail {
  move(MoveTestOptions { ..default_move_options(), update_x: False })
}

test no_update_y() fail {
  move(MoveTestOptions { ..default_move_options(), update_y: False })
}

test no_update_fuel() fail {
  move(MoveTestOptions { ..default_move_options(), update_fuel: False })
}

test exceed_max_distance() fail {
  move(MoveTestOptions { ..default_move_options(), delta_x: 30, delta_y: 1 })
}
