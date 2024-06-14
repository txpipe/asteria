use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/transaction.{
  InlineDatum, Input, Mint, Output, OutputReference, ScriptContext, Transaction,
  TransactionId,
}
use aiken/transaction/credential.{Address, ScriptCredential}
use aiken/transaction/value.{AssetName, Value, add, from_lovelace}
use asteria/test_mock as mock
use asteria/test_utils
use asteria/types.{
  AssetClass, AsteriaDatum, BurnShip, MintShip, ShipDatum, Speed,
}
use spacetime

// ==============================================================================================
// Mint Tests
// ==============================================================================================

type MintTestOptions {
  initial_x: Int,
  initial_y: Int,
  fuel_paid: Int,
  latest_time: Int,
  ship_counter: Int,
  initial_fuel: Int,
  ship_tokens_paid: Int,
  extra_token_amount: Int,
  fuel_minted_amount: Int,
  ship_token_minted_amount: Int,
  pilot_token_minted_amount: Int,
  ship_token_name: AssetName,
  datum_ship_name: AssetName,
  pilot_token_name: AssetName,
  datum_pilot_name: AssetName,
  includes_ship_output: Bool,
  includes_asteria_input: Bool,
  uses_correct_latest_time: Bool,
}

fn get_default_mint_options() {
  MintTestOptions {
    initial_x: 10,
    initial_y: 10,
    fuel_paid: 40,
    latest_time: 10_000,
    ship_counter: 7,
    initial_fuel: 40,
    ship_tokens_paid: 1,
    extra_token_amount: 0,
    fuel_minted_amount: 40,
    ship_token_minted_amount: 1,
    pilot_token_minted_amount: 1,
    ship_token_name: "SHIP7",
    datum_ship_name: "SHIP7",
    pilot_token_name: "PILOT7",
    datum_pilot_name: "PILOT7",
    includes_ship_output: True,
    includes_asteria_input: True,
    uses_correct_latest_time: True,
  }
}

fn ship_mint(options: MintTestOptions) -> Bool {
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let min_distance = 10
  let shipyard_policy = mock.shipyard_policy
  let max_speed = Speed { distance: 1, time: 1_000 }
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let ship_address =
    Address {
      payment_credential: ScriptCredential(shipyard_policy),
      stake_credential: None,
    }
  let ship_datum =
    ShipDatum {
      pos_x: options.initial_x,
      pos_y: options.initial_y,
      ship_token_name: options.datum_ship_name,
      pilot_token_name: options.datum_pilot_name,
      last_move_latest_time: if options.uses_correct_latest_time {
        options.latest_time
      } else {
        0
      },
    }
  let ship_value =
    from_lovelace(2_000_000)
      |> add(shipyard_policy, options.ship_token_name, options.ship_tokens_paid)
      |> add(mock.pellet_credential, "FUEL", options.fuel_paid)
      |> add("aaaa", "tokenA", options.extra_token_amount)
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
      value: ship_value,
      datum: InlineDatum(ship_datum),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: if options.includes_asteria_input {
        [asteria_in]
      } else {
        []
      },
      reference_inputs: [],
      outputs: if options.includes_ship_output {
        [ship_out]
      } else {
        []
      },
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        value.from_asset(
          shipyard_policy,
          options.ship_token_name,
          options.ship_token_minted_amount,
        )
          |> value.add(
              shipyard_policy,
              options.pilot_token_name,
              options.pilot_token_minted_amount,
            )
          |> value.add(mock.pellet_credential, "FUEL", options.fuel_minted_amount),
      ),
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound { bound_type: Finite(1), is_inclusive: True },
        upper_bound: IntervalBound {
          bound_type: Finite(options.latest_time),
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
      max_speed,
      max_ship_fuel,
      fuel_per_step,
      options.initial_fuel,
      min_distance,
      redeemer,
      ctx: mint_ctx,
    )
  result
}

test mint_ok() {
  ship_mint(get_default_mint_options())
}

test mint_no_asteria_input() fail {
  ship_mint(
    MintTestOptions {
      ..get_default_mint_options(),
      includes_asteria_input: False,
    },
  )
}

test mint_ship_token_not_minted() fail {
  ship_mint(
    MintTestOptions {
      ..get_default_mint_options(),
      ship_token_minted_amount: 0,
    },
  )
}

test mint_ship_token_wrong_amount() fail {
  ship_mint(
    MintTestOptions {
      ..get_default_mint_options(),
      ship_token_minted_amount: 2,
    },
  )
}

test mint_pilot_token_not_minted() fail {
  ship_mint(
    MintTestOptions {
      ..get_default_mint_options(),
      pilot_token_minted_amount: 0,
    },
  )
}

test mint_pilot_token_wrong_amount() fail {
  ship_mint(
    MintTestOptions {
      ..get_default_mint_options(),
      pilot_token_minted_amount: 2,
    },
  )
}

test mint_fuel_tokens_not_minted() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), fuel_minted_amount: 0 },
  )
}

test mint_fuel_tokens_wrong_amount() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), fuel_minted_amount: 50 },
  )
}

test mint_wrong_ship_token_prefix() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), ship_token_name: "SHI7" },
  )
}

test mint_wrong_ship_token_count() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), ship_token_name: "SHP8" },
  )
}

test mint_wrong_pilot_token_prefix() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), pilot_token_name: "PILO7" },
  )
}

test mint_wrong_pilot_token_count() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), pilot_token_name: "PILOT8" },
  )
}

test mint_no_ship_output() fail {
  ship_mint(
    MintTestOptions {
      ..get_default_mint_options(),
      includes_ship_output: False,
    },
  )
}

test mint_initial_distance_below_min() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), initial_x: 3, initial_y: 3 },
  )
}

test mint_wrong_ship_name_in_datum() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), datum_ship_name: "FOO" },
  )
}

test mint_wrong_pilot_name_in_datum() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), datum_pilot_name: "FOO" },
  )
}

test mint_wrong_latest_time_in_datum() fail {
  ship_mint(
    MintTestOptions {
      ..get_default_mint_options(),
      uses_correct_latest_time: False,
    },
  )
}

test mint_ship_token_not_paid() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), ship_tokens_paid: 0 },
  )
}

test mint_wrong_initial_fuel() fail {
  ship_mint(MintTestOptions { ..get_default_mint_options(), fuel_paid: 30 })
}

test mint_add_extra_token() fail {
  ship_mint(
    MintTestOptions { ..get_default_mint_options(), extra_token_amount: 1 },
  )
}

// ==============================================================================================
// Burn Tests
// ==============================================================================================

type BurnTestOptions {
  pos_x: Int,
  pos_y: Int,
  ship_addr: Address,
  include_ship_input: Bool,
  burnt_value: Value,
}

fn get_default_burn_options() -> BurnTestOptions {
  let ship_addr =
    Address {
      payment_credential: ScriptCredential(mock.ship_credential),
      stake_credential: None,
    }
  let burnt_value =
    value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
  BurnTestOptions {
    pos_x: 5,
    pos_y: -12,
    ship_addr,
    include_ship_input: True,
    burnt_value,
  }
}

fn ship_burn(options: BurnTestOptions) -> Bool {
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let initial_fuel = 40
  let min_distance = 10
  let ship_token_name = mock.ship_token_name
  let pilot_token_name = mock.pilot_token_name
  let shipyard_policy = mock.shipyard_policy
  let transaction_id = mock.transaction_id_1
  let max_speed = Speed { distance: 1, time: 1_000 }
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = BurnShip
  let ship_datum =
    ShipDatum {
      pos_x: options.pos_x,
      pos_y: options.pos_y,
      ship_token_name,
      pilot_token_name,
      last_move_latest_time: 0,
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
      inputs: if options.include_ship_input {
        [ship_in]
      } else {
        []
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
      max_speed,
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
  ship_burn(get_default_burn_options())
}

test burn_more_than_one() fail {
  let def_options = get_default_burn_options()
  let burnt_value =
    value.from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
      |> value.add(mock.shipyard_policy, mock.pilot_token_name, -1)
  let options = BurnTestOptions { ..def_options, burnt_value: burnt_value }
  ship_burn(options)
}
