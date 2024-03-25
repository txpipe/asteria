use aiken/bytearray.{length, from_string, take}
use aiken/dict.{keys}
use aiken/list.{any}
use aiken/transaction.{Input}
use aiken/transaction/value.{PolicyId, tokens}

pub fn is_ship_token_input(inputs: List<Input>, shipyard_policy: PolicyId) -> Bool {
  let ship_bytes = from_string(@"SHIP")
  any(inputs, fn (input) {
    let token_names = keys(tokens(input.output.value, shipyard_policy))
    any(token_names, fn (name) {
      take(name, length(ship_bytes)) == ship_bytes
    })
  })
}
