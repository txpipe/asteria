use aiken/collection/list
use aiken/option.{is_some}
use asteria/types.{AssetClass}
use asteria/utils
use cardano/assets.{quantity_of}
use cardano/transaction.{OutputReference, Transaction}

validator deploy(admin_token: AssetClass) {
  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _utxo: OutputReference,
    self: Transaction,
  ) {
    let Transaction { inputs, .. } = self
    let is_admin_token_input =
      is_some(
        list.find(
          inputs,
          fn(input) {
            not(utils.is_script_address(input.output.address)) && quantity_of(
              input.output.value,
              admin_token.policy,
              admin_token.name,
            ) > 0
          },
        ),
      )
    is_admin_token_input
  }

  else(_) {
    fail
  }
}
