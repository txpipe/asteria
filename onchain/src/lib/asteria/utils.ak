use aiken/math
use cardano/address.{Address, Script, VerificationKey}

pub fn distance(delta_x: Int, delta_y: Int) -> Int {
  math.abs(delta_x) + math.abs(delta_y)
}

pub fn required_fuel(distance: Int, fuel_per_step: Int) -> Int {
  distance * fuel_per_step
}

pub fn is_script_address(address: Address) -> Bool {
  when address.payment_credential is {
    VerificationKey(_) -> False
    Script(_) -> True
  }
}
