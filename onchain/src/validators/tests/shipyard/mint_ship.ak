use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria/test_mock as mock
use asteria/types.{
  AddNewShip, AssetClass, AsteriaDatum, MintShip, ShipDatum, Speed,
}
use cardano/address.{Address, Script}
use cardano/assets.{AssetName, add, from_asset, from_lovelace}
use cardano/transaction.{
  InlineDatum, Input, Mint, Output, OutputReference, Spend, Transaction,
}
use spacetime

// ==============================================================================================
// MintShip Tests
// ==============================================================================================

type MintTestOptions {
  initial_x: Int,
  initial_y: Int,
  fuel_paid: Int,
  latest_time: Int,
  ship_counter: Int,
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

fn mint_ship(options: MintTestOptions) -> Bool {
  let fuel_per_step = 1
  let max_ship_fuel = 100
  let shipyard_policy = mock.shipyard_policy
  let max_speed = Speed { distance: 1, time: 1_000 }
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
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
  let asteria_address =
    Address {
      payment_credential: Script(mock.asteria_credential),
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
      output_reference: OutputReference { transaction_id, output_index: 0 },
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
          bound_type: Finite(options.latest_time),
          is_inclusive: True,
        },
      },
      extra_signatories: [],
      redeemers: [
        Pair(
          Mint(shipyard_policy),
          {
            let redeemer_data: Data = redeemer
            redeemer_data
          },
        ),
        Pair(
          Spend(asteria_in.output_reference),
          {
            let redeemer_data: Data = AddNewShip
            redeemer_data
          },
        ),
      ],
      datums: dict.empty,
      id: transaction_id,
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }
  let result =
    spacetime.spacetime.mint(
      mock.pellet_credential,
      mock.asteria_credential,
      admin_token,
      max_speed,
      max_ship_fuel,
      fuel_per_step,
      redeemer,
      shipyard_policy,
      tx,
    )
  result
}

test mint_ok() {
  mint_ship(get_default_mint_options())
}

test no_asteria_input() fail {
  mint_ship(
    MintTestOptions {
      ..get_default_mint_options(),
      includes_asteria_input: False,
    },
  )
}
