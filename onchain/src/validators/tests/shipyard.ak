use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/transaction.{
  InlineDatum, Input, Mint, Output, OutputReference, ScriptContext, Transaction,
  TransactionId,
}
use aiken/transaction/credential.{Address, ScriptCredential}
use aiken/transaction/value.{AssetName, PolicyId, Value, add, from_lovelace}
use asteria/test_mock as mock
use asteria/test_utils
use asteria/types.{AssetClass, AsteriaDatum, BurnShip, MintShip, ShipDatum}
use spacetime

// ==============================================================================================
// Mint Tests
// ==============================================================================================

type MintTestOptions {
  initial_fuel: Int,
  initial_x: Int,
  initial_y: Int,
  ship_counter: Int,
  shipyard_policy: PolicyId,
  ship_token_name: AssetName,
  pilot_token_name: AssetName,
  no_asteria_input: Bool,
  no_ship_output: Bool,
  ship_datum: ShipDatum,
  ship_value: Value,
}

type MintTestArgs {
  initial_fuel: Int,
  initial_x: Int,
  initial_y: Int,
  ship_counter: Int,
  ship_token_name: AssetName,
  pilot_token_name: AssetName,
  no_asteria_input: Bool,
  no_ship_output: Bool,
}

fn default_args() {
  MintTestArgs {
    initial_fuel: 40,
    initial_x: 10,
    initial_y: 10,
    ship_counter: 7,
    ship_token_name: mock.ship_token_name,
    pilot_token_name: mock.pilot_token_name,
    no_asteria_input: False,
    no_ship_output: False,
  }
}

fn set_mint_test_options(args: MintTestArgs) -> MintTestOptions {
  let shipyard_policy = mock.shipyard_policy
  let ship_datum =
    ShipDatum {
      fuel: args.initial_fuel,
      pos_x: args.initial_x,
      pos_y: args.initial_y,
      ship_token_name: args.ship_token_name,
      pilot_token_name: args.pilot_token_name,
    }
  let ship_value =
    from_lovelace(2_000_000)
      |> add(shipyard_policy, args.ship_token_name, 1)
  MintTestOptions {
    initial_fuel: args.initial_fuel,
    initial_x: args.initial_x,
    initial_y: args.initial_y,
    ship_counter: args.ship_counter,
    ship_token_name: args.ship_token_name,
    pilot_token_name: args.pilot_token_name,
    no_asteria_input: args.no_asteria_input,
    no_ship_output: args.no_ship_output,
    shipyard_policy,
    ship_datum,
    ship_value,
  }
}

fn ship_mint(options: MintTestOptions) -> Bool {
  let max_distance = 30
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_fuel = 40
  let min_distance = 10
  let shipyard_policy = options.shipyard_policy
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let ship_address =
    Address {
      payment_credential: ScriptCredential(shipyard_policy),
      stake_credential: None,
    }
  let asteria_address =
    Address {
      payment_credential: ScriptCredential(mock.asteria_credential),
      stake_credential: None,
    }
  let admin_policy = mock.admin_policy
  let admin_token_name = mock.admin_token_name
  let transaction_id = mock.transaction_id_1
  let redeemer = MintShip
  let asteria_datum =
    AsteriaDatum { ship_counter: options.ship_counter, shipyard_policy }
  let asteria_in = {
    let output = {
      let value =
        from_lovelace(2_000_000)
          |> add(admin_policy, admin_token_name, 1)
      Output {
        address: asteria_address,
        value,
        datum: InlineDatum(asteria_datum),
        reference_script: None,
      }
    }
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: transaction_id },
        output_index: 0,
      },
      output,
    }
  }
  let ship_out =
    Output {
      address: ship_address,
      value: options.ship_value,
      datum: InlineDatum(options.ship_datum),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: if options.no_asteria_input {
        []
      } else {
        [asteria_in]
      },
      reference_inputs: [],
      outputs: if options.no_ship_output {
        []
      } else {
        [ship_out]
      },
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        value.from_asset(shipyard_policy, options.ship_token_name, 1)
          |> value.add(shipyard_policy, options.pilot_token_name, 1),
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
            key: Mint(shipyard_policy),
            value: {
              let redeemer_data: Data = redeemer
              redeemer_data
            },
            compare: test_utils.script_purpose_compare,
          ),
      datums: dict.new(),
      id: TransactionId { hash: transaction_id },
    }
  let mint_ctx =
    ScriptContext { transaction: tx, purpose: Mint(shipyard_policy) }
  let result =
    spacetime.mint(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_distance,
      max_ship_fuel,
      fuel_per_step,
      initial_fuel,
      min_distance,
      redeemer,
      ctx: mint_ctx,
    )
  result
}

test mint_ok() {
  ship_mint(set_mint_test_options(default_args()))
}

test no_asteria_input() fail {
  let args = MintTestArgs { ..default_args(), no_asteria_input: True }
  ship_mint(set_mint_test_options(args))
}

test wrong_ship_token_prefix() fail {
  let args = MintTestArgs { ..default_args(), ship_token_name: "SHI7" }
  ship_mint(set_mint_test_options(args))
}

test wrong_ship_token_count() fail {
  let args = MintTestArgs { ..default_args(), ship_token_name: "SHIP8" }
  ship_mint(set_mint_test_options(args))
}

test wrong_pilot_token_prefix() fail {
  let args = MintTestArgs { ..default_args(), pilot_token_name: "PILO7" }
  ship_mint(set_mint_test_options(args))
}

test wrong_pilot_token_count() fail {
  let args = MintTestArgs { ..default_args(), pilot_token_name: "PILOT8" }
  ship_mint(set_mint_test_options(args))
}

test no_ship_output() fail {
  let args = MintTestArgs { ..default_args(), no_ship_output: True }
  ship_mint(set_mint_test_options(args))
}

test wrong_initial_fuel() fail {
  let args = MintTestArgs { ..default_args(), initial_fuel: 30 }
  ship_mint(set_mint_test_options(args))
}

test initial_distance_below_min() fail {
  let args = MintTestArgs { ..default_args(), initial_x: 3, initial_y: 3 }
  ship_mint(set_mint_test_options(args))
}

test wrong_ship_name_in_datum() fail {
  let default_options = set_mint_test_options(default_args())
  let wrong_datum =
    ShipDatum { ..default_options.ship_datum, ship_token_name: "FOO" }
  let options = MintTestOptions { ..default_options, ship_datum: wrong_datum }
  ship_mint(options)
}

test wrong_pilot_name_in_datum() fail {
  let default_options = set_mint_test_options(default_args())
  let wrong_datum =
    ShipDatum { ..default_options.ship_datum, pilot_token_name: "FOO" }
  let options = MintTestOptions { ..default_options, ship_datum: wrong_datum }
  ship_mint(options)
}

test ship_token_not_paid() fail {
  let wrong_value = value.from_lovelace(2_000_000)
  let options =
    MintTestOptions {
      ..set_mint_test_options(default_args()),
      ship_value: wrong_value,
    }
  ship_mint(options)
}

// ==============================================================================================
// Burn Tests
// ==============================================================================================

type BurnTestOptions {
  pos_x: Int,
  pos_y: Int,
  ship_addr: Address,
  shipyard_policy: PolicyId,
  no_ship_input: Bool,
  burnt_value: Value,
}

fn set_burn_test_options() -> BurnTestOptions {
  let ship_addr =
    Address {
      payment_credential: ScriptCredential(mock.ship_credential),
      stake_credential: None,
    }
  let burnt_value =
    value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
  BurnTestOptions {
    pos_x: 0,
    pos_y: 0,
    ship_addr,
    shipyard_policy: mock.shipyard_policy,
    no_ship_input: False,
    burnt_value,
  }
}

fn ship_burn(options: BurnTestOptions) -> Bool {
  let max_distance = 30
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_fuel = 40
  let min_distance = 10
  let ship_token_name = mock.ship_token_name
  let pilot_token_name = mock.pilot_token_name
  let shipyard_policy = options.shipyard_policy
  let transaction_id = mock.transaction_id_1
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = BurnShip
  let ship_datum =
    ShipDatum {
      fuel: 40,
      pos_x: options.pos_x,
      pos_y: options.pos_y,
      ship_token_name,
      pilot_token_name,
    }
  let ship_in = {
    let output = {
      let value =
        from_lovelace(2_000_000)
          |> add(shipyard_policy, ship_token_name, 1)
      Output {
        address: options.ship_addr,
        value,
        datum: InlineDatum(ship_datum),
        reference_script: None,
      }
    }
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: transaction_id },
        output_index: 0,
      },
      output,
    }
  }
  let tx =
    Transaction {
      inputs: if options.no_ship_input {
        []
      } else {
        [ship_in]
      },
      reference_inputs: [],
      outputs: [],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(options.burnt_value),
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
            key: Mint(shipyard_policy),
            value: {
              let redeemer_data: Data = redeemer
              redeemer_data
            },
            compare: test_utils.script_purpose_compare,
          ),
      datums: dict.new(),
      id: TransactionId { hash: transaction_id },
    }
  let mint_ctx =
    ScriptContext { transaction: tx, purpose: Mint(shipyard_policy) }
  let result =
    spacetime.mint(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_distance,
      max_ship_fuel,
      fuel_per_step,
      initial_fuel,
      min_distance,
      redeemer,
      ctx: mint_ctx,
    )
  result
}

test burn_ok() {
  ship_burn(set_burn_test_options())
}

test no_ship_input() fail {
  let options =
    BurnTestOptions { ..set_burn_test_options(), no_ship_input: True }
  ship_burn(options)
}

test ship_not_at_center() fail {
  let options = BurnTestOptions { ..set_burn_test_options(), pos_x: 1 }
  ship_burn(options)
}

test burn_more_than_one() fail {
  let def_options = set_burn_test_options()
  let burnt_value =
    value.from_asset(def_options.shipyard_policy, mock.ship_token_name, -1)
      |> value.add(def_options.shipyard_policy, mock.pilot_token_name, -1)
  let options = BurnTestOptions { ..def_options, burnt_value: burnt_value }
  ship_burn(options)
}
