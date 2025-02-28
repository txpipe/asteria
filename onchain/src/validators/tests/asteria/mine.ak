use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria
use asteria/test_mock as mock
use asteria/types.{AssetClass, AsteriaDatum, Mine, MineAsteria, ShipDatum}
use cardano/address.{Address, Script}
use cardano/assets.{
  ada_asset_name, ada_policy_id, add, from_asset, from_lovelace, zero,
}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Spend, Transaction,
}

// ==============================================================================================
// Mine Tests
// ==============================================================================================

type MineTestOptions {
  lovelace_mined: Int,
  preserve_counter: Bool,
  include_ship_token: Bool,
  // fields from spacetime/mine_asteria:MineTestOptions
  ship_pos_x: Int,
  ship_pos_y: Int,
  burns_ship_token: Bool,
  burns_fuel_tokens: Bool,
  respects_latest_time: Bool,
}

fn default_mine_options() {
  MineTestOptions {
    lovelace_mined: 6_000_000,
    preserve_counter: True,
    include_ship_token: True,
    // fields from spacetime/mine_asteria:MineTestOptions
    ship_pos_x: 0,
    ship_pos_y: 0,
    burns_ship_token: True,
    burns_fuel_tokens: True,
    respects_latest_time: True,
  }
}

fn mine(options: MineTestOptions) -> Bool {
  let ship_fuel = 30
  let ship_mint_lovelace_fee = 2_000
  let max_asteria_mining = 50
  let ship_counter = 7
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
  let redeemer = Mine
  let asteria_address =
    Address {
      payment_credential: Script(mock.asteria_credential),
      stake_credential: None,
    }
  let asteria_datum =
    AsteriaDatum { ship_counter, shipyard_policy: mock.shipyard_policy }
  let asteria_in = {
    let output =
      Output {
        address: asteria_address,
        value: from_lovelace(12_000_000)
          |> add(mock.admin_policy, mock.admin_token_name, 1),
        datum: InlineDatum(asteria_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference { transaction_id: mock.transaction_id_1, output_index: 0 }
    Input { output_reference, output }
  }
  let ship_address =
    Address {
      payment_credential: Script(mock.ship_credential),
      stake_credential: None,
    }
  let ship_value =
    if options.include_ship_token {
      from_lovelace(2_000_000)
        |> add(mock.shipyard_policy, mock.ship_token_name, 1)
        |> add(mock.pellet_credential, "FUEL", ship_fuel)
    } else {
      from_lovelace(2_000_000)
        |> add(mock.pellet_credential, "FUEL", ship_fuel)
    }
  let ship_datum =
    ShipDatum {
      pos_x: options.ship_pos_x,
      pos_y: options.ship_pos_y,
      ship_token_name: mock.ship_token_name,
      pilot_token_name: mock.pilot_token_name,
      last_move_latest_time,
    }

  let ship_in = {
    let output =
      Output {
        address: ship_address,
        value: ship_value,
        datum: InlineDatum(ship_datum),
        reference_script: None,
      }
    let output_reference =
      OutputReference { transaction_id: mock.transaction_id_2, output_index: 0 }
    Input { output_reference, output }
  }
  let asteria_out =
    Output {
      address: asteria_address,
      value: asteria_in.output.value
        |> add(ada_policy_id, ada_asset_name, -options.lovelace_mined),
      datum: if options.preserve_counter {
        InlineDatum(asteria_datum)
      } else {
        InlineDatum(
          AsteriaDatum { ..asteria_datum, ship_counter: ship_counter + 1 },
        )
      },
      reference_script: None,
    }
  let tx =
    Transaction {
      inputs: [asteria_in, ship_in],
      reference_inputs: [],
      outputs: [asteria_out],
      fee: 5_000,
      mint: if options.burns_ship_token {
        if options.burns_fuel_tokens {
          from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
            |> add(mock.pellet_credential, "FUEL", -ship_fuel)
        } else {
          from_asset(mock.shipyard_policy, mock.ship_token_name, -1)
        }
      } else {
        zero
      },
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
      // FIXME: Two mint redeemers missing here!
      redeemers: [
        Pair(
          Spend(asteria_in.output_reference),
          {
            let redeemer_data: Data = Mine
            redeemer_data
          },
        ),
        Pair(
          Spend(ship_in.output_reference),
          {
            let redeemer_data: Data = MineAsteria
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
  let initial_fuel = 480
  let result =
    asteria.asteria.spend(
      mock.pellet_credential,
      admin_token,
      ship_mint_lovelace_fee,
      max_asteria_mining,
      min_distance,
      initial_fuel,
      Some(asteria_datum),
      redeemer,
      asteria_in.output_reference,
      tx,
    )
  result
}

test mine_ok() {
  mine(default_mine_options())
}

test no_ship_token() fail {
  mine(MineTestOptions { ..default_mine_options(), include_ship_token: False })
}

test exceed_mining() fail {
  mine(MineTestOptions { ..default_mine_options(), lovelace_mined: 6_000_001 })
}

test alter_counter() fail {
  mine(MineTestOptions { ..default_mine_options(), preserve_counter: False })
}

test wrong_x_pos() fail {
  mine(MineTestOptions { ..default_mine_options(), ship_pos_x: 1 })
}

test wrong_y_pos() fail {
  mine(MineTestOptions { ..default_mine_options(), ship_pos_y: 1 })
}

test ship_token_not_burnt() fail {
  mine(MineTestOptions { ..default_mine_options(), burns_ship_token: False })
}

test fuel_tokens_not_burnt() fail {
  mine(MineTestOptions { ..default_mine_options(), burns_fuel_tokens: False })
}

test no_respect_latest_time() fail {
  mine(
    MineTestOptions { ..default_mine_options(), respects_latest_time: False },
  )
}
