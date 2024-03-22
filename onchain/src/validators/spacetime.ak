use aiken/transaction.{ScriptContext}
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{AssetName, PolicyId}
use asteria/types.{ShipDatum, ShipRedeemer}

validator(
  _pellet_validator_address: Address,
  _asteria_validator_address: Address,
  _admin_token: (PolicyId, AssetName),
) {
  fn spend(
    _datum: ShipDatum,
    _redeemer: ShipRedeemer,
    _ctx: ScriptContext,
  ) -> Bool {
    True
  }
}
