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
use asteria/test_mock as mock
use asteria/test_utils
use asteria/types.{
  AssetClass, GatherFuel, MineAsteria, MoveShip, PelletDatum, Quit, ShipDatum,
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
  let initial_x = -20
  let initial_y = -20
  let max_moving_distance = 30
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_pellet_fuel = 40
  let min_asteria_distance = 10
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
  let ship_value =
    if options.include_ship_token {
      min_ada
        |> add(mock.shipyard_policy, mock.ship_token_name, 1)
    } else {
      min_ada
    }
  let ship_datum_in =
    ShipDatum {
      fuel: options.initial_fuel,
      pos_x: initial_x,
      pos_y: initial_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
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
      ship_token_name: mock.ship_token_name,
      pilot_token_name: if options.preserve_pilot_token {
        mock.pilot_token_name
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_in = {
    let output = {
      let value =
        if options.include_pilot_token {
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
  let ship_out =
    Output {
      address: ship_address,
      value: if options.preserve_value {
        ship_in.output.value
      } else {
        ship_in.output.value |> add(ada_policy_id, ada_asset_name, 1)
      },
      datum: InlineDatum(ship_datum_out),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: if options.include_ship_input {
        [ship_in, pilot_in]
      } else {
        [pilot_in]
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
              let datum_data: Data = InlineDatum(ship_datum_in)
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
      max_moving_distance,
      max_ship_fuel,
      fuel_per_step,
      initial_pellet_fuel,
      min_asteria_distance,
      ship_datum_in,
      redeemer,
      spend_ctx,
    )
  result
}

test move_ok() {
  move(default_move_options())
}

test move_no_ship_token() fail {
  move(MoveTestOptions { ..default_move_options(), include_ship_token: False })
}

test move_no_ship_input() fail {
  move(MoveTestOptions { ..default_move_options(), include_ship_input: False })
}

test move_no_ship_output() fail {
  move(MoveTestOptions { ..default_move_options(), include_ship_output: False })
}

test move_no_pilot_token() fail {
  move(MoveTestOptions { ..default_move_options(), include_pilot_token: False })
}

test move_not_enough_fuel() fail {
  move(MoveTestOptions { ..default_move_options(), initial_fuel: 5 })
}

test move_alter_ship_value() fail {
  move(MoveTestOptions { ..default_move_options(), preserve_value: False })
}

test move_alter_pilot_token() fail {
  move(
    MoveTestOptions { ..default_move_options(), preserve_pilot_token: False },
  )
}

test move_no_update_x() fail {
  move(MoveTestOptions { ..default_move_options(), update_x: False })
}

test move_no_update_y() fail {
  move(MoveTestOptions { ..default_move_options(), update_y: False })
}

test move_no_update_fuel() fail {
  move(MoveTestOptions { ..default_move_options(), update_fuel: False })
}

test move_exceed_max_distance() fail {
  move(MoveTestOptions { ..default_move_options(), delta_x: 30, delta_y: 1 })
}

// ==============================================================================================
// GatherFuel Tests
// ==============================================================================================

type GatherTestOptions {
  amount: Int,
  initial_fuel: Int,
  ship_pos_x: Int,
  ship_pos_y: Int,
  update_fuel: Bool,
  preserve_pos_x: Bool,
  include_ship_token: Bool,
}

fn default_gather_options() {
  GatherTestOptions {
    amount: 10,
    initial_fuel: 40,
    ship_pos_x: 10,
    ship_pos_y: 10,
    update_fuel: True,
    preserve_pos_x: True,
    include_ship_token: True,
  }
}

fn gather(options: GatherTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let pellet_fuel = 20
  let pellet_pos_x = 10
  let pellet_pos_y = 10
  let max_moving_distance = 30
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_pellet_fuel = 40
  let min_asteria_distance = 10
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = GatherFuel(options.amount)
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
      fuel: pellet_fuel,
      pos_x: pellet_pos_x,
      pos_y: pellet_pos_y,
      shipyard_policy: mock.shipyard_policy,
    }
  let pellet_in = {
    let output =
      Output {
        address: pellet_address,
        value: value.from_lovelace(2_000_000)
          |> value.add(mock.admin_policy, mock.admin_token_name, 1),
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
  let ship_value =
    if options.include_ship_token {
      min_ada
        |> add(mock.shipyard_policy, mock.ship_token_name, 1)
    } else {
      min_ada
    }
  let ship_datum_in =
    ShipDatum {
      fuel: options.initial_fuel,
      pos_x: options.ship_pos_x,
      pos_y: options.ship_pos_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
    }
  let ship_datum_out =
    ShipDatum {
      fuel: if options.update_fuel {
        options.initial_fuel + options.amount
      } else {
        options.initial_fuel
      },
      pos_x: if options.preserve_pos_x {
        options.ship_pos_x
      } else {
        options.ship_pos_x + 1
      },
      pos_y: options.ship_pos_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_in = {
    let output = {
      let value =
        min_ada
          |> add(mock.shipyard_policy, mock.pilot_token_name, 1)
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
  let ship_out =
    Output {
      address: ship_address,
      value: ship_in.output.value,
      datum: InlineDatum(ship_datum_out),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: [ship_in, pilot_in, pellet_in],
      reference_inputs: [],
      outputs: [ship_out],
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
              let datum_data: Data = InlineDatum(ship_datum_in)
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
      max_moving_distance,
      max_ship_fuel,
      fuel_per_step,
      initial_pellet_fuel,
      min_asteria_distance,
      ship_datum_in,
      redeemer,
      spend_ctx,
    )
  result
}

test gather_ok() {
  gather(default_gather_options())
}

test gather_no_ship_token() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), include_ship_token: False },
  )
}

test gather_different_pos_x() fail {
  gather(GatherTestOptions { ..default_gather_options(), ship_pos_x: 9 })
}

test gather_different_pos_y() fail {
  gather(GatherTestOptions { ..default_gather_options(), ship_pos_y: 9 })
}

test gather_exceed_fuel_capacity() fail {
  gather(GatherTestOptions { ..default_gather_options(), amount: 61 })
}

test gather_no_update_gathered_fuel() fail {
  gather(GatherTestOptions { ..default_gather_options(), update_fuel: False })
}

test gather_alter_pos_x() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), preserve_pos_x: False },
  )
}

// ==============================================================================================
// MineAsteria Tests
// ==============================================================================================

type MineTestOptions {
  ship_pos_x: Int,
  ship_pos_y: Int,
  include_asteria_input: Bool,
  burn_ship_token: Bool,
  include_ship_token: Bool,
}

fn default_mine_options() {
  MineTestOptions {
    ship_pos_x: 0,
    ship_pos_y: 0,
    include_asteria_input: True,
    burn_ship_token: True,
    include_ship_token: True,
  }
}

fn mine(options: MineTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let max_distance = 30
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_fuel = 40
  let min_distance = 10
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
  let asteria_in = {
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
  let ship_value =
    if options.include_ship_token {
      min_ada
        |> add(mock.shipyard_policy, mock.ship_token_name, 1)
    } else {
      min_ada
    }
  let ship_datum_in =
    ShipDatum {
      fuel: 40,
      pos_x: options.ship_pos_x,
      pos_y: options.ship_pos_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_in = {
    let output = {
      let value =
        min_ada
          |> add(mock.shipyard_policy, mock.pilot_token_name, 1)
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
  let ship_out =
    Output {
      address: ship_address,
      value: ship_in.output.value,
      datum: InlineDatum(ship_datum_in),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: if options.include_asteria_input {
        [ship_in, pilot_in, asteria_in]
      } else {
        [ship_in, pilot_in]
      },
      reference_inputs: [],
      outputs: [ship_out],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        if options.burn_ship_token {
          value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
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
              let datum_data: Data = InlineDatum(ship_datum_in)
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
      max_distance,
      max_ship_fuel,
      fuel_per_step,
      initial_fuel,
      min_distance,
      ship_datum_in,
      redeemer,
      spend_ctx,
    )
  result
}

test mine_mine_ok() {
  mine(default_mine_options())
}

test mine_no_ship_token() fail {
  mine(MineTestOptions { ..default_mine_options(), include_ship_token: False })
}

test mine_wrong_x_pos() fail {
  mine(MineTestOptions { ..default_mine_options(), ship_pos_x: 1 })
}

test mine_wrong_y_pos() fail {
  mine(MineTestOptions { ..default_mine_options(), ship_pos_y: 1 })
}

test mine_no_asteria_input() fail {
  mine(
    MineTestOptions { ..default_mine_options(), include_asteria_input: False },
  )
}

test mine_ship_token_not_burnt() fail {
  mine(MineTestOptions { ..default_mine_options(), burn_ship_token: False })
}

// ==============================================================================================
// Quit Tests
// ==============================================================================================

type QuitTestOptions {
  burn_ship_token: Bool,
  include_ship_token: Bool,
}

fn default_quit_options() {
  QuitTestOptions { burn_ship_token: True, include_ship_token: True }
}

fn quit(options: QuitTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let max_distance = 30
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_fuel = 40
  let min_distance = 10
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
    if options.include_ship_token {
      min_ada
        |> add(mock.shipyard_policy, mock.ship_token_name, 1)
    } else {
      min_ada
    }
  let ship_datum_in =
    ShipDatum {
      fuel: 40,
      pos_x: 10,
      pos_y: 10,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
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
        transaction_id: TransactionId { hash: mock.transaction_id_1 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let pilot_in = {
    let output = {
      let value =
        min_ada
          |> add(mock.shipyard_policy, mock.pilot_token_name, 1)
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
  let tx =
    Transaction {
      inputs: [ship_in, pilot_in],
      reference_inputs: [],
      outputs: [],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        if options.burn_ship_token {
          value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
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
              let datum_data: Data = InlineDatum(ship_datum_in)
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
      max_distance,
      max_ship_fuel,
      fuel_per_step,
      initial_fuel,
      min_distance,
      ship_datum_in,
      redeemer,
      spend_ctx,
    )
  result
}

test quit_ok() {
  quit(default_quit_options())
}

test quit_ship_token_not_burnt() fail {
  quit(QuitTestOptions { ..default_quit_options(), burn_ship_token: False })
}

test quit_no_ship_token() fail {
  quit(QuitTestOptions { ..default_quit_options(), include_ship_token: False })
}
