use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{Address}

validator(
  _asteria_validator_address: Address,
  _spacetime_validator_address: Address,
) {
  fn spend(_redeemer: Data, _ctx: ScriptContext) -> Bool {
    True
  }
}
