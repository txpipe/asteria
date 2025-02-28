use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria/test_mock as mock
use asteria/types.{
  AssetClass, GatherFuel, PelletDatum, Provide, ShipDatum, Speed,
}
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{add, from_lovelace, zero}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Spend, Transaction,
}
use spacetime

// ==============================================================================================
// GatherFuel Tests
// ==============================================================================================

type GatherTestOptions {
  ship_added_amount: Int,
  pellet_provided_amount: Int,
  ship_initial_fuel: Int,
  ship_pos_x: Int,
  ship_pos_y: Int,
  output_ship_token_amount: Int,
  extra_token_amount: Int,
  adds_fuel_tokens: Bool,
  preserves_pos_x: Bool,
  includes_pilot_token: Bool,
  includes_ship_output: Bool,
}

fn default_gather_options() {
  GatherTestOptions {
    ship_added_amount: 10,
    pellet_provided_amount: 10,
    ship_initial_fuel: 40,
    ship_pos_x: 10,
    ship_pos_y: 10,
    output_ship_token_amount: 1,
    extra_token_amount: 0,
    adds_fuel_tokens: True,
    preserves_pos_x: True,
    includes_pilot_token: True,
    includes_ship_output: True,
  }
}

fn gather(options: GatherTestOptions) -> Bool {
  let min_ada = from_lovelace(2_000_000)
  let pellet_fuel = 20
  let pellet_pos_x = 10
  let pellet_pos_y = 10
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let max_speed = Speed { distance: 1, time: 1_000 }
  let earliest_time = 10_000
  let latest_time = earliest_time + 20_000
  let last_move_latest_time = 5_000
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let ship_redeemer = GatherFuel(options.ship_added_amount)
  let pellet_redeemer = Provide(options.pellet_provided_amount)
  let pilot_address =
    Address {
      payment_credential: VerificationKey(mock.pilot_credential),
      stake_credential: None,
    }
  let pellet_address =
    Address {
      payment_credential: Script(mock.pellet_credential),
      stake_credential: None,
    }
  let pellet_datum =
    PelletDatum {
      pos_x: pellet_pos_x,
      pos_y: pellet_pos_y,
      shipyard_policy: mock.shipyard_policy,
    }
  let pellet_output_reference =
    OutputReference { transaction_id: mock.transaction_id_2, output_index: 0 }
  let pellet_input = {
    let output =
      Output {
        address: pellet_address,
        value: from_lovelace(2_000_000)
          |> add(mock.admin_policy, mock.admin_token_name, 1)
          |> add(mock.pellet_credential, "FUEL", pellet_fuel),
        datum: InlineDatum(pellet_datum),
        reference_script: None,
      }
    Input { output_reference: pellet_output_reference, output }
  }
  let ship_address =
    Address {
      payment_credential: Script(mock.ship_credential),
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
          options.ship_initial_fuel + options.ship_added_amount,
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
  let ship_output_reference =
    OutputReference { transaction_id: mock.transaction_id_1, output_index: 0 }
  let ship_input = {
    let output =
      Output {
        address: ship_address,
        value: ship_input_value,
        datum: InlineDatum(ship_input_datum),
        reference_script: None,
      }
    Input { output_reference: ship_output_reference, output }
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
      OutputReference { transaction_id: mock.transaction_id_1, output_index: 1 }
    Input { output_reference, output }
  }
  let ship_output =
    Output {
      address: ship_address,
      value: if options.adds_fuel_tokens {
        ship_output_value
      } else {
        ship_output_value
          |> add(mock.pellet_credential, "FUEL", -options.ship_added_amount)
      },
      datum: InlineDatum(ship_output_datum),
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: [ship_input, pilot_input, pellet_input],
      reference_inputs: [],
      outputs: if options.includes_ship_output {
        [ship_output]
      } else {
        []
      },
      fee: 5_000,
      mint: zero,
      certificates: [],
      withdrawals: [],
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
      redeemers: [
        Pair(
          Spend(ship_output_reference),
          {
            let redeemer_data: Data = ship_redeemer
            redeemer_data
          },
        ),
        Pair(
          Spend(pellet_output_reference),
          {
            let redeemer_data: Data = pellet_redeemer
            redeemer_data
          },
        ),
      ],
      datums: dict.empty
        |> dict.insert(
            mock.transaction_id_1,
            {
              let datum_data: Data = InlineDatum(ship_input_datum)
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
    spacetime.spacetime.spend(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_speed,
      max_ship_fuel,
      fuel_per_step,
      Some(ship_input_datum),
      ship_redeemer,
      ship_input.output_reference,
      tx,
    )
  result
}

test gather_ok() {
  gather(default_gather_options())
}

// adding external fuel is allowed by spacetime
test external_fuel_added() {
  gather(
    GatherTestOptions { ..default_gather_options(), ship_added_amount: 60 },
  )
}

test no_ship_output() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      includes_ship_output: False,
    },
  )
}

test no_pilot_token() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      includes_pilot_token: False,
    },
  )
}

test add_extra_token() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), extra_token_amount: 1 },
  )
}

test fuel_not_added() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), adds_fuel_tokens: False },
  )
}

test exceed_fuel_capacity() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), ship_added_amount: 61 },
  )
}

test alter_pos_x() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), preserves_pos_x: False },
  )
}

test no_ship_token_output() fail {
  gather(
    GatherTestOptions {
      ..default_gather_options(),
      output_ship_token_amount: 0,
    },
  )
}

test fuel_removed() fail {
  gather(
    GatherTestOptions { ..default_gather_options(), ship_added_amount: -10 },
  )
}
