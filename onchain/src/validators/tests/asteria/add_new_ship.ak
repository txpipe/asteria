use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria
use asteria/test_mock as mock
use asteria/types.{AddNewShip, AssetClass, AsteriaDatum, ShipDatum}
use cardano/address.{Address, Script}
use cardano/assets.{
  AssetName, ada_asset_name, ada_policy_id, add, from_asset, from_lovelace,
}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Spend, Transaction,
}

// ==============================================================================================
// AddNewShip Tests
// ==============================================================================================

type AddTestOptions {
  pay_fee: Bool,
  include_admin_token: Bool,
  update_counter: Bool,
  preserve_policy: Bool,
  // fields from mint_ship:MintTestOptions
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
  uses_correct_latest_time: Bool,
}

fn default_add_options() {
  AddTestOptions {
    pay_fee: True,
    include_admin_token: True,
    update_counter: True,
    preserve_policy: True,
    // fields from mint_ship:MintTestOptions
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
    uses_correct_latest_time: True,
  }
}

fn add_new_ship(options: AddTestOptions) -> Bool {
  let shipyard_policy = mock.shipyard_policy
  let ship_mint_lovelace_fee = 2_000
  let max_asteria_mining = 40
  let ship_counter = options.ship_counter
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let redeemer = AddNewShip
  let asteria_address =
    Address {
      payment_credential: Script(mock.asteria_credential),
      stake_credential: None,
    }
  let asteria_value =
    if options.include_admin_token {
      from_lovelace(10_000_000)
        |> add(mock.admin_policy, mock.admin_token_name, 1)
    } else {
      from_lovelace(10_000_000)
    }
  let asteria_datum = AsteriaDatum { ship_counter, shipyard_policy }
  let asteria_in = {
    let output =
      Output {
        address: asteria_address,
        value: asteria_value,
        datum: InlineDatum(asteria_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference { transaction_id: mock.transaction_id_1, output_index: 0 }
    Input { output_reference, output }
  }
  let asteria_out =
    Output {
      address: asteria_address,
      value: if options.pay_fee {
        asteria_in.output.value
          |> add(ada_policy_id, ada_asset_name, ship_mint_lovelace_fee)
      } else {
        asteria_in.output.value
      },
      datum: if options.update_counter {
        if options.preserve_policy {
          InlineDatum(AsteriaDatum { ..asteria_datum, ship_counter: 8 })
        } else {
          InlineDatum(AsteriaDatum { shipyard_policy: "ffff", ship_counter: 8 })
        }
      } else {
        InlineDatum(asteria_datum)
      },
      reference_script: None,
    }
  let ship_address =
    Address {
      payment_credential: Script(shipyard_policy),
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
  let ship_out =
    Output {
      address: ship_address,
      value: ship_value,
      datum: InlineDatum(ship_datum),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: [asteria_in],
      reference_inputs: [],
      outputs: if options.includes_ship_output {
        [asteria_out, ship_out]
      } else {
        [asteria_out]
      },
      fee: 5_000,
      mint: from_asset(
        shipyard_policy,
        options.ship_token_name,
        options.ship_token_minted_amount,
      )
        |> add(
            shipyard_policy,
            options.pilot_token_name,
            options.pilot_token_minted_amount,
          )
        |> add(mock.pellet_credential, "FUEL", options.fuel_minted_amount),
      certificates: [],
      withdrawals: [],
      validity_range: Interval {
        lower_bound: IntervalBound { bound_type: Finite(1), is_inclusive: True },
        upper_bound: IntervalBound {
          bound_type: Finite(10_000),
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
              let datum_data: Data = InlineDatum(asteria_datum)
              datum_data
            },
          ),
      id: mock.transaction_id_3,
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }
  let min_distance = 10
  let result =
    asteria.asteria.spend(
      mock.pellet_credential,
      admin_token,
      ship_mint_lovelace_fee,
      max_asteria_mining,
      min_distance,
      options.initial_fuel,
      Some(asteria_datum),
      redeemer,
      OutputReference { transaction_id: mock.transaction_id_1, output_index: 0 },
      tx,
    )
  result
}

test add_ok() {
  add_new_ship(default_add_options())
}

test no_fee_paid() fail {
  add_new_ship(AddTestOptions { ..default_add_options(), pay_fee: False })
}

test no_admin_token() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), include_admin_token: False },
  )
}

test counter_not_updated() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), update_counter: False },
  )
}

test shipyard_policy_not_preserved() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), preserve_policy: False },
  )
}

test ship_token_not_minted() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), ship_token_minted_amount: 0 },
  )
}

test ship_token_wrong_amount() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), ship_token_minted_amount: 2 },
  )
}

test pilot_token_not_minted() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), pilot_token_minted_amount: 0 },
  )
}

test pilot_token_wrong_amount() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), pilot_token_minted_amount: 2 },
  )
}

test fuel_tokens_not_minted() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), fuel_minted_amount: 0 },
  )
}

test fuel_tokens_wrong_amount() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), fuel_minted_amount: 50 },
  )
}

test wrong_ship_token_prefix() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), ship_token_name: "SHI7" },
  )
}

test wrong_ship_token_count() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), ship_token_name: "SHP8" },
  )
}

test wrong_pilot_token_prefix() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), pilot_token_name: "PILO7" },
  )
}

test wrong_pilot_token_count() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), pilot_token_name: "PILOT8" },
  )
}

test no_ship_output() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), includes_ship_output: False },
  )
}

test initial_distance_below_min() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), initial_x: 3, initial_y: 3 },
  )
}

test wrong_ship_name_in_datum() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), datum_ship_name: "FOO" },
  )
}

test wrong_pilot_name_in_datum() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), datum_pilot_name: "FOO" },
  )
}

test wrong_latest_time_in_datum() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), uses_correct_latest_time: False },
  )
}

test ship_token_not_paid() fail {
  add_new_ship(AddTestOptions { ..default_add_options(), ship_tokens_paid: 0 })
}

test wrong_initial_fuel() fail {
  add_new_ship(AddTestOptions { ..default_add_options(), fuel_paid: 30 })
}

test add_extra_token() fail {
  add_new_ship(
    AddTestOptions { ..default_add_options(), extra_token_amount: 1 },
  )
}
