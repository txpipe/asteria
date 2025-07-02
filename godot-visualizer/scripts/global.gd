extends Node

const grid_size = 80
const cell_size = 128

var ships: Array[ShipData] = []
var fuels: Array[FuelData] = []
var asteria: AsteriaData = null

var mode = ""
var explorer_url = ""
var follow_ship_id = null
var follow_position = null


func init_data(data: Variant):
	ships = []
	fuels = []
	asteria = null
	
	for item in data["data"]["objectsInRadius"]:
		
		var position = Vector2(item["position"]["x"], item["position"]["y"])
		
		if item["__typename"] == "Ship":
			ships.append(ShipData.new(
				item["id"],
				item["fuel"],
				position,
				item["shipTokenName"]["name"],
				item["pilotTokenName"]["name"]
			))
		
		if item["__typename"] == "Fuel":
			fuels.append(FuelData.new(item["id"], item["fuel"], position))
		
		if item["__typename"] == "Asteria":
			asteria = AsteriaData.new(item["id"], item["totalRewards"], position)

func get_ships():
	return ships

func get_fuels():
	return fuels

func get_asteria():
	return asteria

func get_grid_size():
	return grid_size

func get_cell_size():
	return cell_size

func set_explorer_url(_explorer_url: String):
	explorer_url = _explorer_url

func get_explorer_url():
	return explorer_url

func set_mode(_mode: String):
	mode = _mode

func get_mode():
	return mode

func set_follow_ship_id(_follow_ship_id: String):
	follow_ship_id = _follow_ship_id

func get_follow_ship_id():
	return follow_ship_id

func set_follow_position(_follow_position: Vector2):
	follow_position = _follow_position

func get_follow_position():
	return follow_position


class ShipData:
	var id: String = ""
	var fuel: int = 0
	var position: Vector2 = Vector2(0, 0)
	var shipTokenName: String = ""
	var pilotTokenName: String = ""
	
	func _init(_id: String, _fuel: int, _position: Vector2, _shipTokenName: String, _pilotTokenName: String):
		id = _id
		fuel = _fuel
		position = _position
		shipTokenName = _shipTokenName
		pilotTokenName = _pilotTokenName


class FuelData:
	var id: String = ""
	var fuel: int = 0
	var position: Vector2 = Vector2(0, 0)
	
	func _init(_id: String, _fuel: int, _position: Vector2):
		id = _id
		fuel = _fuel
		position = _position


class AsteriaData:
	var id: String = ""
	var totalRewards: int = 0
	var position: Vector2 = Vector2(0, 0)
	
	func _init(_id: String, _totalRewards: int, _position: Vector2):
		id = _id
		totalRewards = _totalRewards
		position = _position
