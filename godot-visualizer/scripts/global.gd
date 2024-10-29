extends Node

const grid_size = 200
const cell_size = 128

var ships: Array[ShipData] = []
var fuels: Array[FuelData] = []
var asteria: AsteriaData = null


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
			fuels.append(FuelData.new(item["fuel"], position))
		
		if item["__typename"] == "Asteria":
			asteria = AsteriaData.new(item["totalRewards"], position)

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
	var fuel: int = 0
	var position: Vector2 = Vector2(0, 0)
	
	func _init(_fuel: int, _position: Vector2):
		fuel = _fuel
		position = _position


class AsteriaData:
	var totalRewards: int = 0
	var position: Vector2 = Vector2(0, 0)
	
	func _init(_totalRewards: int, _position: Vector2):
		totalRewards = _totalRewards
		position = _position
