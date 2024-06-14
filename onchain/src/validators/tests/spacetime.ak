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
use aiken/transaction/value.{add, from_lovelace}
use asteria/test_mock as mock
use asteria/test_utils
use asteria/types.{
  AssetClass, GatherFuel, MineAsteria, MoveShip, PelletDatum, Quit, ShipDatum,
  Speed,
}
use asteria/utils.{distance}
use spacetime

// ==============================================================================================
// MoveShip Tests
// ==============================================================================================

type MoveTestOptions {
  delta_x: Int,
  delta_y: Int,
  initial_fuel: Int,
  extra_token_amount: Int,
  output_ship_token_amount: Int,
  includes_ship_token: Bool,
  includes_ship_output: Bool,
  includes_pilot_token: Bool,
  preserves_pilot_token: Bool,
  updates_x: Bool,
  updates_y: Bool,
  subtracts_spent_fuel: Bool,
  updates_latest_time: Bool,
  respects_latest_time: Bool,
  excludes_extra_script_input: Bool,
  burns_spent_fuel: Bool,
}

fn default_move_options() {
  MoveTestOptions {
    delta_x: 10,
    delta_y: 10,
    initial_fuel: 40,
    extra_token_amount: 0,
    output_ship_token_amount: 1,
    includes_ship_token: True,
    includes_ship_output: True,
    includes_pilot_token: True,
    preserves_pilot_token: True,
    updates_x: True,
    updates_y: True,
    subtracts_spent_fuel: True,
    updates_latest_time: True,
    respects_latest_time: True,
    excludes_extra_script_input: True,
    burns_spent_fuel: True,
  }
}

fn move(options: MoveTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let initial_x = -20
  let initial_y = -20
  let fuel_per_step = 1
  let required_fuel = fuel_per_step * distance(options.delta_x, options.delta_y)
  let max_ship_fuel = 100
  let initial_pellet_fuel = 40
  let min_asteria_distance = 10
  let max_speed = Speed { distance: 1, time: 1_000 }
  let earliest_time =
    if options.respects_latest_time {
      10_000
    } else {
      0
    }
  let latest_time = earliest_time + 20_000
  let last_move_latest_time = 5_000
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = MoveShip(options.delta_x, options.delta_y)
  let pilot_address =
    Address {
      payment_credential: VerificationKeyCredential(mock.pilot_credential),
      stake_credential: None,
    }
  let ship_address =
    Address {
      payment_credential: ScriptCredential(mock.ship_credential),
      stake_credential: None,
    }
  let ship_input_value =
    min_ada
      |> add(mock.shipyard_policy, mock.ship_token_name, 1)
      |> add(mock.pellet_credential, "FUEL", options.initial_fuel)
  let ship_output_value =
    min_ada
      |> add(
          mock.shipyard_policy,
          mock.ship_token_name,
          options.output_ship_token_amount,
        )
      |> add(mock.pellet_credential, "FUEL", options.initial_fuel - required_fuel)
      |> add("aaaa", "tokenA", options.extra_token_amount)
  let ship_input_datum =
    ShipDatum {
      pos_x: initial_x,
      pos_y: initial_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
      last_move_latest_time,
    }
  let ship_output_datum =
    ShipDatum {
      pos_x: if options.updates_x {
        initial_x + options.delta_x
      } else {
        initial_x
      },
      pos_y: if options.updates_y {
        initial_y + options.delta_y
      } else {
        initial_y
      },
      ship_token_name: mock.ship_token_name,
      pilot_token_name: if options.preserves_pilot_token {
        mock.pilot_token_name
      } else {
        "FOO"
      },
      last_move_latest_time: if options.updates_latest_time {
        latest_time
      } else {
        last_move_latest_time
      },
    }
  let extra_script_input = {
    let output =
      Output {
        address: Address {
          payment_credential: ScriptCredential("7777"),
          stake_credential: None,
        },
        value: value.zero(),
        datum: NoDatum,
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let ship_input = {
    let output =
      Output {
        address: ship_address,
        value: ship_input_value,
        datum: InlineDatum(ship_input_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_input = {
    let output = {
      let value =
        if options.includes_pilot_token {
          min_ada
            |> add(mock.shipyard_policy, mock.pilot_token_name, 1)
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 1,
      }
    Input { output_reference, output }
  }
  let ship_output =
    Output {
      address: ship_address,
      value: if options.subtracts_spent_fuel {
        ship_output_value
      } else {
        ship_output_value |> add(mock.pellet_credential, "FUEL", required_fuel)
      },
      datum: InlineDatum(ship_output_datum),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: if options.excludes_extra_script_input {
        [ship_input, pilot_input]
      } else {
        [ship_input, pilot_input, extra_script_input]
      },
      reference_inputs: [],
      outputs: if options.includes_ship_output {
        [ship_output]
      } else {
        []
      },
      fee: value.from_lovelace(5_000),
      mint: if options.burns_spent_fuel {
        value.to_minted_value(
          value.from_asset(mock.pellet_credential, "FUEL", -required_fuel),
        )
      } else {
        value.to_minted_value(value.zero())
      },
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound {
          bound_type: Finite(earliest_time),
          is_inclusive: True,
        },
        upper_bound: IntervalBound {
          bound_type: Finite(latest_time),
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
              let datum_data: Data = InlineDatum(ship_input_datum)
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
  let result =
    spacetime.spend(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_speed,
      max_ship_fuel,
      fuel_per_step,
      initial_pellet_fuel,
      min_asteria_distance,
      ship_input_datum,
      redeemer,
      spend_ctx,
    )
  result
}

test move_ok() {
  move(default_move_options())
}

test move_more_than_1_script_input() fail {
  move(
    MoveTestOptions {
      ..default_move_options(),
      excludes_extra_script_input: False,
    },
  )
}

test move_no_ship_output() fail {
  move(
    MoveTestOptions { ..default_move_options(), includes_ship_output: False },
  )
}

test move_no_pilot_token() fail {
  move(
    MoveTestOptions { ..default_move_options(), includes_pilot_token: False },
  )
}

test move_add_extra_token() fail {
  move(MoveTestOptions { ..default_move_options(), extra_token_amount: 1 })
}

test move_not_enough_fuel() fail {
  move(MoveTestOptions { ..default_move_options(), initial_fuel: 5 })
}

test move_exceed_max_speed() fail {
  move(MoveTestOptions { ..default_move_options(), delta_x: 30, delta_y: 1 })
}

test move_no_respect_latest_time() fail {
  move(
    MoveTestOptions { ..default_move_options(), respects_latest_time: False },
  )
}

test move_not_subtracts_spent_fuel() fail {
  move(
    MoveTestOptions { ..default_move_options(), subtracts_spent_fuel: False },
  )
}

test move_not_burns_spent_fuel() fail {
  move(MoveTestOptions { ..default_move_options(), burns_spent_fuel: False })
}

test move_no_update_x() fail {
  move(MoveTestOptions { ..default_move_options(), updates_x: False })
}

test move_no_update_y() fail {
  move(MoveTestOptions { ..default_move_options(), updates_y: False })
}

test move_no_update_upper_bound() fail {
  move(MoveTestOptions { ..default_move_options(), updates_latest_time: False })
}

test move_alter_pilot_token() fail {
  move(
    MoveTestOptions { ..default_move_options(), preserves_pilot_token: False },
  )
}

test move_no_ship_token_output() fail {
  move(
    MoveTestOptions { ..default_move_options(), output_ship_token_amount: 0 },
  )
}

// ==============================================================================================
// GatherFuel Tests
// ==============================================================================================

type GatherTestOptions {
  provided_amount: Int,
  ship_initial_fuel: Int,
  ship_pos_x: Int,
  ship_pos_y: Int,
  output_ship_token_amount: Int,
  extra_token_amount: Int,
  adds_fuel_tokens: Bool,
  preserves_pos_x: Bool,
  includes_pilot_token: Bool,
  includes_ship_output: Bool,
  respects_latest_time: Bool,
  excludes_extra_script_input: Bool,
}

fn default_gather_options() {
  GatherTestOptions {
    provided_amount: 10,
    ship_initial_fuel: 40,
    ship_pos_x: 10,
    ship_pos_y: 10,
    output_ship_token_amount: 1,
    extra_token_amount: 0,
    adds_fuel_tokens: True,
    preserves_pos_x: True,
    includes_pilot_token: True,
    includes_ship_output: True,
    respects_latest_time: True,
    excludes_extra_script_input: True,
  }
}

fn gather(options: GatherTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let pellet_fuel = 20
  let pellet_pos_x = 10
  let pellet_pos_y = 10
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_pellet_fuel = 40
  let min_asteria_distance = 10
  let max_speed = Speed { distance: 1, time: 1_000 }
  let earliest_time =
    if options.respects_latest_time {
      10_000
    } else {
      0
    }
  let latest_time = earliest_time + 20_000
  let last_move_latest_time = 5_000
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = GatherFuel(options.provided_amount)
  let pilot_address =
    Address {
      payment_credential: VerificationKeyCredential(mock.pilot_credential),
      stake_credential: None,
    }
  let pellet_address =
    Address {
      payment_credential: ScriptCredential(mock.pellet_credential),
      stake_credential: None,
    }
  let pellet_datum =
    PelletDatum {
      pos_x: pellet_pos_x,
      pos_y: pellet_pos_y,
      shipyard_policy: mock.shipyard_policy,
    }
  let pellet_input = {
    let output =
      Output {
        address: pellet_address,
        value: value.from_lovelace(2_000_000)
          |> value.add(mock.admin_policy, mock.admin_token_name, 1)
          |> value.add(mock.pellet_credential, "FUEL", pellet_fuel),
        datum: InlineDatum(pellet_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_2 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let ship_address =
    Address {
      payment_credential: ScriptCredential(mock.ship_credential),
      stake_credential: None,
    }
  let ship_input_value =
    min_ada
      |> add(mock.shipyard_policy, mock.ship_token_name, 1)
      |> add(mock.pellet_credential, "FUEL", options.ship_initial_fuel)
  let ship_output_value =
    min_ada
      |> add(
          mock.shipyard_policy,
          mock.ship_token_name,
          options.output_ship_token_amount,
        )
      |> add(
          mock.pellet_credential,
          "FUEL",
          options.ship_initial_fuel + options.provided_amount,
        )
      |> add("aaaa", "tokenA", options.extra_token_amount)
  let ship_input_datum =
    ShipDatum {
      pos_x: options.ship_pos_x,
      pos_y: options.ship_pos_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
      last_move_latest_time,
    }
  let ship_output_datum =
    ShipDatum {
      pos_x: if options.preserves_pos_x {
        options.ship_pos_x
      } else {
        options.ship_pos_x + 1
      },
      pos_y: options.ship_pos_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
      last_move_latest_time,
    }
  let extra_script_input = {
    let output =
      Output {
        address: Address {
          payment_credential: ScriptCredential("7777"),
          stake_credential: None,
        },
        value: value.zero(),
        datum: NoDatum,
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let ship_input = {
    let output =
      Output {
        address: ship_address,
        value: ship_input_value,
        datum: InlineDatum(ship_input_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_input = {
    let output = {
      let value =
        if options.includes_pilot_token {
          min_ada
            |> add(mock.shipyard_policy, mock.pilot_token_name, 1)
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 1,
      }
    Input { output_reference, output }
  }
  let ship_output =
    Output {
      address: ship_address,
      value: if options.adds_fuel_tokens {
        ship_output_value
      } else {
        ship_output_value
          |> add(mock.pellet_credential, "FUEL", -options.provided_amount)
      },
      datum: InlineDatum(ship_output_datum),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: if options.excludes_extra_script_input {
        [ship_input, pilot_input, pellet_input]
      } else {
        [ship_input, pilot_input, pellet_input, extra_script_input]
      },
      reference_inputs: [],
      outputs: if options.includes_ship_output {
        [ship_output]
      } else {
        []
      },
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(value.zero()),
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound {
          bound_type: Finite(earliest_time),
          is_inclusive: True,
        },
        upper_bound: IntervalBound {
          bound_type: Finite(latest_time),
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
              let datum_data: Data = InlineDatum(ship_input_datum)
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
  let result =
    spacetime.spend(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_speed,
      max_ship_fuel,
      fuel_per_step,
      initial_pellet_fuel,
      min_asteria_distance,
      ship_input_datum,
      redeemer,
      spend_ctx,
    )
  result
}

test gather_ok() {
  gather(default_gather_options())
}

test gather_more_than_2_script_inputs() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      excludes_extra_script_input: False,
    },
  )
}

test gather_no_ship_output() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      includes_ship_output: False,
    },
  )
}

test gather_no_pilot_token() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      includes_pilot_token: False,
    },
  )
}

test gather_different_pos_x() fail {
  gather(GatherTestOptions { ..default_gather_options(), ship_pos_x: 9 })
}

test gather_different_pos_y() fail {
  gather(GatherTestOptions { ..default_gather_options(), ship_pos_y: 9 })
}

test gather_add_extra_token() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), extra_token_amount: 1 },
  )
}

test gather_fuel_not_added() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), adds_fuel_tokens: False },
  )
}

test gather_exceed_fuel_capacity() fail {
  gather(GatherTestOptions { ..default_gather_options(), provided_amount: 61 })
}

test gather_no_respect_latest_time() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      respects_latest_time: False,
    },
  )
}

test gather_alter_pos_x() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), preserves_pos_x: False },
  )
}

test gather_no_ship_token_output() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      output_ship_token_amount: 0,
    },
  )
}

// ==============================================================================================
// MineAsteria Tests
// ==============================================================================================

type MineTestOptions {
  ship_pos_x: Int,
  ship_pos_y: Int,
  output_ship_token_amount: Int,
  includes_ship_token: Bool,
  includes_pilot_token: Bool,
  includes_asteria_input: Bool,
  burns_ship_token: Bool,
  burns_fuel_tokens: Bool,
  respects_latest_time: Bool,
  excludes_extra_script_input: Bool,
}

fn default_mine_options() {
  MineTestOptions {
    ship_pos_x: 0,
    ship_pos_y: 0,
    output_ship_token_amount: 1,
    includes_ship_token: True,
    includes_pilot_token: True,
    includes_asteria_input: True,
    burns_ship_token: True,
    burns_fuel_tokens: True,
    respects_latest_time: True,
    excludes_extra_script_input: True,
  }
}

fn mine(options: MineTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_fuel = 40
  let ship_fuel = 30
  let min_distance = 10
  let max_speed = Speed { distance: 1, time: 1_000 }
  let earliest_time =
    if options.respects_latest_time {
      10_000
    } else {
      0
    }
  let latest_time = earliest_time + 20_000
  let last_move_latest_time = 5_000
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = MineAsteria
  let pilot_address =
    Address {
      payment_credential: VerificationKeyCredential(mock.pilot_credential),
      stake_credential: None,
    }
  let asteria_address =
    Address {
      payment_credential: ScriptCredential(mock.asteria_credential),
      stake_credential: None,
    }
  let asteria_input = {
    let output =
      Output {
        address: asteria_address,
        value: value.from_lovelace(7_000_000)
          |> value.add(mock.admin_policy, mock.admin_token_name, 1),
        datum: NoDatum,
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_2 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let ship_address =
    Address {
      payment_credential: ScriptCredential(mock.ship_credential),
      stake_credential: None,
    }
  let ship_input_value =
    min_ada
      |> add(mock.shipyard_policy, mock.ship_token_name, 1)
      |> add(mock.pellet_credential, "FUEL", ship_fuel)
  let ship_input_datum =
    ShipDatum {
      pos_x: options.ship_pos_x,
      pos_y: options.ship_pos_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
      last_move_latest_time,
    }
  let ship_input = {
    let output =
      Output {
        address: ship_address,
        value: ship_input_value,
        datum: InlineDatum(ship_input_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_input = {
    let output = {
      let value =
        if options.includes_pilot_token {
          min_ada
            |> add(mock.shipyard_policy, mock.pilot_token_name, 1)
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 1,
      }
    Input { output_reference, output }
  }
  let extra_script_input = {
    let output =
      Output {
        address: Address {
          payment_credential: ScriptCredential("7777"),
          stake_credential: None,
        },
        value: value.zero(),
        datum: NoDatum,
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
      inputs: if options.includes_asteria_input {
        if options.excludes_extra_script_input {
          [ship_input, pilot_input, asteria_input]
        } else {
          [ship_input, pilot_input, asteria_input, extra_script_input]
        }
      } else {
        [ship_input, pilot_input]
      },
      reference_inputs: [],
      outputs: [],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        if options.burns_ship_token {
          if options.burns_fuel_tokens {
            value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
              |> add(mock.pellet_credential, "FUEL", -ship_fuel)
          } else {
            value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
          }
        } else {
          value.zero()
        },
      ),
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound {
          bound_type: Finite(earliest_time),
          is_inclusive: True,
        },
        upper_bound: IntervalBound {
          bound_type: Finite(latest_time),
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
              let datum_data: Data = InlineDatum(ship_input_datum)
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
  let result =
    spacetime.spend(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_speed,
      max_ship_fuel,
      fuel_per_step,
      initial_fuel,
      min_distance,
      ship_input_datum,
      redeemer,
      spend_ctx,
    )
  result
}

test mine_mine_ok() {
  mine(default_mine_options())
}

test mine_no_asteria_input() fail {
  mine(
    MineTestOptions { ..default_mine_options(), includes_asteria_input: False },
  )
}

test mine_more_than_2_script_inputs() fail {
  mine(
    MineTestOptions {
      ..default_mine_options(),
      excludes_extra_script_input: False,
    },
  )
}

test mine_no_pilot_token() fail {
  mine(
    MineTestOptions { ..default_mine_options(), includes_pilot_token: False },
  )
}

test mine_wrong_x_pos() fail {
  mine(MineTestOptions { ..default_mine_options(), ship_pos_x: 1 })
}

test mine_wrong_y_pos() fail {
  mine(MineTestOptions { ..default_mine_options(), ship_pos_y: 1 })
}

test mine_ship_token_not_burnt() fail {
  mine(MineTestOptions { ..default_mine_options(), burns_ship_token: False })
}

test mine_fuel_tokens_not_burnt() fail {
  mine(MineTestOptions { ..default_mine_options(), burns_fuel_tokens: False })
}

test mine_no_respect_latest_time() fail {
  mine(
    MineTestOptions { ..default_mine_options(), respects_latest_time: False },
  )
}

// ==============================================================================================
// Quit Tests
// ==============================================================================================

type QuitTestOptions {
  burns_ship_token: Bool,
  burns_fuel_tokens: Bool,
  includes_pilot_token: Bool,
  excludes_extra_script_input: Bool,
}

fn default_quit_options() {
  QuitTestOptions {
    burns_ship_token: True,
    burns_fuel_tokens: True,
    includes_pilot_token: True,
    excludes_extra_script_input: True,
  }
}

fn quit(options: QuitTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_fuel = 40
  let ship_fuel = 30
  let min_distance = 10
  let max_speed = Speed { distance: 1, time: 1_000 }
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = Quit
  let pilot_address =
    Address {
      payment_credential: VerificationKeyCredential(mock.pilot_credential),
      stake_credential: None,
    }
  let ship_address =
    Address {
      payment_credential: ScriptCredential(mock.ship_credential),
      stake_credential: None,
    }
  let ship_value =
    min_ada
      |> add(mock.shipyard_policy, mock.ship_token_name, 1)
      |> add(mock.pellet_credential, "FUEL", ship_fuel)
  let ship_input_datum =
    ShipDatum {
      pos_x: 10,
      pos_y: 10,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
      last_move_latest_time: 0,
    }

  let ship_input = {
    let output =
      Output {
        address: ship_address,
        value: ship_value,
        datum: InlineDatum(ship_input_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_input = {
    let output = {
      let value =
        if options.includes_pilot_token {
          min_ada
            |> add(mock.shipyard_policy, mock.pilot_token_name, 1)
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 1,
      }
    Input { output_reference, output }
  }
  let extra_script_input = {
    let output =
      Output {
        address: Address {
          payment_credential: ScriptCredential("7777"),
          stake_credential: None,
        },
        value: value.zero(),
        datum: NoDatum,
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
      inputs: if options.excludes_extra_script_input {
        [ship_input, pilot_input]
      } else {
        [ship_input, pilot_input, extra_script_input]
      },
      reference_inputs: [],
      outputs: [],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        if options.burns_ship_token {
          if options.burns_fuel_tokens {
            value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
              |> add(mock.pellet_credential, "FUEL", -ship_fuel)
          } else {
            value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
          }
        } else {
          value.zero()
        },
      ),
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
              let datum_data: Data = InlineDatum(ship_input_datum)
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
  let result =
    spacetime.spend(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_speed,
      max_ship_fuel,
      fuel_per_step,
      initial_fuel,
      min_distance,
      ship_input_datum,
      redeemer,
      spend_ctx,
    )
  result
}

test quit_ok() {
  quit(default_quit_options())
}

test quit_more_than_1_script_input() fail {
  quit(
    QuitTestOptions {
      ..default_quit_options(),
      excludes_extra_script_input: False,
    },
  )
}

test quit_no_pilot_token() fail {
  quit(
    QuitTestOptions { ..default_quit_options(), includes_pilot_token: False },
  )
}

test quit_ship_token_not_burnt() fail {
  quit(QuitTestOptions { ..default_quit_options(), burns_ship_token: False })
}

test quit_fuel_tokens_not_burnt() fail {
  quit(QuitTestOptions { ..default_quit_options(), burns_fuel_tokens: False })
}
