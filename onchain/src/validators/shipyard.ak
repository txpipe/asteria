use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{Address}
use asteria/types.{ShipyardRedeemer}

validator(
  _asteria_validator_address: Address,
  _spacetime_validator_address: Address,
) {
  fn spend(_redeemer: ShipyardRedeemer, _ctx: ScriptContext) -> Bool {
    True
  }
}
