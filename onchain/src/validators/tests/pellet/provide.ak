use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria/test_mock as mock
use asteria/types.{AssetClass, GatherFuel, PelletDatum, Provide, ShipDatum}
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId, Value, add, from_asset, from_lovelace, zero}
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Spend, Transaction,
}
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
  ship_token_amount: Int,
  datum_in: PelletDatum,
  datum_out: PelletDatum,
  ship_pos_x: Int,
  ship_pos_y: Int,
  respects_latest_time: Bool,
  excludes_extra_script_input: Bool,
  mints_no_tokens: Bool,
}

fn default_provide_options() -> ProvideTestOptions {
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
    ship_token_amount: 1,
    datum_in: pellet_datum,
    datum_out: pellet_datum,
    ship_pos_x: 1,
    ship_pos_y: 2,
    respects_latest_time: True,
    excludes_extra_script_input: True,
    mints_no_tokens: True,
  }
}

fn provide(options: ProvideTestOptions) -> Bool {
  let earliest_time =
    if options.respects_latest_time {
      10_000
    } else {
      0
    }
  let latest_time = earliest_time + 20_000
  let last_move_latest_time = 5_000
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
          payment_credential: Script(mock.pellet_credential),
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
        transaction_id: transaction_id_1,
        output_index: 0,
      },
      output,
    }
  }
  let ship_in = {
    let output = {
      let address =
        Address {
          payment_credential: Script(mock.ship_credential),
          stake_credential: None,
        }
      let value =
        from_lovelace(2_000_000)
          |> add(
              options.shipyard_policy,
              mock.ship_token_name,
              options.ship_token_amount,
            )
      let datum =
        InlineDatum(
          ShipDatum {
            pos_x: options.ship_pos_x,
            pos_y: options.ship_pos_y,
            ship_token_name: mock.ship_token_name,
            pilot_token_name: mock.pilot_token_name,
            last_move_latest_time,
          },
        )
      Output { address, value, datum, reference_script: None }
    }
    let output_reference =
      OutputReference { transaction_id: transaction_id_2, output_index: 0 }
    Input { output_reference, output }
  }
  let pellet_out = {
    let address =
      Address {
        payment_credential: Script(mock.pellet_credential),
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
        payment_credential: Script(mock.ship_credential),
        stake_credential: None,
      }
    let value =
      from_lovelace(2_000_000)
        |> add(options.shipyard_policy, mock.ship_token_name, 1)
    Output { address, value, datum: NoDatum, reference_script: None }
  }
  let tx =
    Transaction {
      inputs: if options.excludes_extra_script_input {
        [ship_in, pellet_in]
      } else {
        [ship_in, pellet_in, pellet_in]
      },
      reference_inputs: [],
      outputs: [ship_out, pellet_out],
      fee: 5_000,
      mint: if options.mints_no_tokens {
        zero
      } else {
        from_asset(mock.fuel_policy, "FUEL", 20)
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
      redeemers: [
        Pair(
          Spend(pellet_in.output_reference),
          {
            let redeemer_data: Data = redeemer
            redeemer_data
          },
        ),
        Pair(
          Spend(ship_in.output_reference),
          {
            let redeemer_data: Data = GatherFuel(options.provided_amount)
            redeemer_data
          },
        ),
      ],
      datums: dict.from_pairs(
        [
          Pair(
            transaction_id_1,
            {
              let datum_data: Data = InlineDatum(datum_in)
              datum_data
            },
          ),
        ],
      ),
      id: mock.transaction_id_1,
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }
  let result =
    pellet.pellet.spend(
      admin_asset,
      Some(datum_in),
      redeemer,
      OutputReference { transaction_id: transaction_id_1, output_index: 0 },
      tx,
    )
  result
}

test provide_ok() {
  provide(default_provide_options())
}

test no_ship_token() fail {
  let options =
    ProvideTestOptions { ..default_provide_options(), ship_token_amount: 0 }
  provide(options)
}

test more_than_2_script_inputs() fail {
  provide(
    ProvideTestOptions {
      ..default_provide_options(),
      excludes_extra_script_input: False,
    },
  )
}

test no_admin_token_output() fail {
  let options =
    ProvideTestOptions {
      ..default_provide_options(),
      pellet_output_value: from_lovelace(2_000_000),
    }
  provide(options)
}

test not_enough_fuel() fail {
  let options =
    ProvideTestOptions { ..default_provide_options(), provided_amount: 60 }
  provide(options)
}

test fuel_not_subtracted() fail {
  let default_options = default_provide_options()
  let options =
    ProvideTestOptions {
      ..default_options,
      pellet_output_value: default_options.pellet_input_value,
    }
  provide(options)
}

test datum_not_preserved() fail {
  let default_options = default_provide_options()
  let datum_in = default_options.datum_in
  let options =
    ProvideTestOptions {
      ..default_options,
      datum_out: PelletDatum { ..datum_in, pos_x: datum_in.pos_x + 1 },
    }
  provide(options)
}

test different_pos_x() fail {
  provide(ProvideTestOptions { ..default_provide_options(), ship_pos_x: 9 })
}

test different_pos_y() fail {
  provide(ProvideTestOptions { ..default_provide_options(), ship_pos_y: 9 })
}

test mint_tokens() fail {
  provide(
    ProvideTestOptions { ..default_provide_options(), mints_no_tokens: False },
  )
}

test no_respect_latest_time() fail {
  provide(
    ProvideTestOptions {
      ..default_provide_options(),
      respects_latest_time: False,
    },
  )
}
