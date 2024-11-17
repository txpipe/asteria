use aiken/collection/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use asteria/test_mock as mock
use asteria/types.{AssetClass, BurnFuel}
use cardano/assets.{from_asset}
use cardano/transaction.{Mint, Transaction}
use pellet

// ==============================================================================================
// MintFuel Tests
// ==============================================================================================

type BurnTestOptions {
  fuel_tokens_burnt: Int,
}

fn get_default_burn_options() {
  BurnTestOptions { fuel_tokens_burnt: 20 }
}

fn burn_fuel(options: BurnTestOptions) -> Bool {
  let redeemer = BurnFuel
  let admin_token =
    AssetClass { policy: mock.admin_policy, name: mock.admin_token_name }
  let tx =
    Transaction {
      inputs: [],
      reference_inputs: [],
      outputs: [],
      fee: 5_000,
      mint: from_asset(mock.fuel_policy, "FUEL", -options.fuel_tokens_burnt),
      certificates: [],
      withdrawals: [],
      validity_range: Interval {
        lower_bound: IntervalBound { bound_type: Finite(1), is_inclusive: True },
        upper_bound: IntervalBound {
          bound_type: Finite(10),
          is_inclusive: True,
        },
      },
      extra_signatories: [],
      redeemers: [
        Pair(
          Mint(mock.fuel_policy),
          {
            let redeemer_data: Data = redeemer
            redeemer_data
          },
        ),
      ],
      datums: dict.empty,
      id: mock.transaction_id_2,
      votes: [],
      proposal_procedures: [],
      current_treasury_amount: None,
      treasury_donation: None,
    }
  let result = pellet.pellet.mint(admin_token, redeemer, mock.fuel_policy, tx)
  result
}

test burn_ok() {
  burn_fuel(get_default_burn_options())
}

test no_fuel_tokens_burnt() fail {
  burn_fuel(BurnTestOptions { fuel_tokens_burnt: 0 })
}
