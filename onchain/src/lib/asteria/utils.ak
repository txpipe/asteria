use aiken/bytearray.{length, take}
use aiken/dict.{keys}
use aiken/list.{any}
use aiken/math
use aiken/transaction.{Output}
use aiken/transaction/value.{AssetName, PolicyId, tokens}

pub fn is_ship_token_in_utxo(utxo: Output, shipyard_policy: PolicyId) -> Bool {
  let token_names = keys(tokens(utxo.value, shipyard_policy))
  any(token_names, fn(name) { has_prefix("SHIP", name) })
}

pub fn has_prefix(prefix: ByteArray, name: AssetName) -> Bool {
  take(name, length(prefix)) == prefix
}

pub fn distance(delta_x: Int, delta_y: Int) -> Int {
  math.abs(delta_x) + math.abs(delta_y)
}
