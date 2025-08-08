extends Node

const grid_size = 100
const cell_size = 128

var ships: Array[ShipData] = []
var pellets: Array[PelletData] = []
var tokens: Array[TokenData] = []
var asteria: AsteriaData = null

var mode = ""
var selected_ship = null


func init_data(data: Variant):
	ships = []
	pellets = []
	tokens = []
	asteria = null
	
	for item in data["data"]["objectsInRadius"]:
		
		var position = Vector2(item["position"]["x"], item["position"]["y"])
		
		if item["__typename"] == "Ship":
			ships.append(ShipData.new(
				item["id"],
				item["fuel"],
				position,
				item["shipTokenName"]["name"],
				item["pilotTokenName"]["name"],
				item["datum"],
				item["assets"]
			))
		
		if item["__typename"] == "Pellet":
			pellets.append(PelletData.new(item["id"], item["fuel"], position, item["datum"], item["assets"]))
		
		if item["__typename"] == "Token":
			tokens.append(TokenData.new(item["id"], item["name"], item["displayName"], item["assetName"], item["amount"], position, item["datum"], item["assets"]))
		
		if item["__typename"] == "Asteria":
			asteria = AsteriaData.new(item["id"], item["totalRewards"], position, item["datum"], item["assets"])

func get_ships():
	return ships

func get_pellets():
	return pellets

func get_tokens():
	return tokens

func get_asteria():
	return asteria

func get_grid_size():
	return grid_size

func get_cell_size():
	return cell_size

func set_mode(_mode: String):
	mode = _mode

func get_mode():
	return mode

func set_selected_ship(_selected_ship: ShipData):
	selected_ship = _selected_ship

func get_selected_ship():
	return selected_ship


class ShipData:
	var id: String = ""
	var fuel: int = 0
	var position: Vector2 = Vector2(0, 0)
	var shipTokenName: String = ""
	var pilotTokenName: String = ""
	var datum: String = ""
	var assets: Variant = []
	
	func _init(_id: String, _fuel: int, _position: Vector2, _shipTokenName: String, _pilotTokenName: String, _datum: String, _assets: Variant):
		id = _id
		fuel = _fuel
		position = _position
		shipTokenName = _shipTokenName
		pilotTokenName = _pilotTokenName
		datum = _datum
		assets = _assets
	
	func json() -> String:
		return JSON.stringify({
			"tx": id,
			"type": "ship",
			"fuel": fuel,
			"position": {
				"x": position.x,
				"y": position.y
			},
			"shipTokenName": shipTokenName,
			"pilotTokenName": pilotTokenName,
			"datum": datum,
			"assets": assets
		})


class PelletData:
	var id: String = ""
	var fuel: int = 0
	var position: Vector2 = Vector2(0, 0)
	var datum: String = ""
	var assets: Variant = []
	
	func _init(_id: String, _fuel: int, _position: Vector2, _datum: String, _assets: Variant):
		id = _id
		fuel = _fuel
		position = _position
		datum = _datum
		assets = _assets
	
	func json() -> String:
		return JSON.stringify({
			"tx": id,
			"type": "fuel",
			"fuel": fuel,
			"position": {
				"x": position.x,
				"y": position.y
			},
			"datum": datum,
			"assets": assets
		})


class TokenData:
	var id: String = ""
	var name: String = ""
	var displayName: String = ""
	var assetName: String = ""
	var amount: int = 0
	var position: Vector2 = Vector2(0, 0)
	var datum: String = ""
	var assets: Variant = []
	
	func _init(_id: String, _name: String, _displayName: String, _assetName: String, _amount: int, _position: Vector2, _datum: String, _assets: Variant):
		id = _id
		name = _name
		displayName = _displayName
		assetName = _assetName
		amount = _amount
		position = _position
		datum = _datum
		assets = _assets
	
	func json() -> String:
		return JSON.stringify({
			"tx": id,
			"type": "token",
			"name": name,
			"displayName": displayName,
			"assetName": assetName,
			"amount": amount,
			"position": {
				"x": position.x,
				"y": position.y
			},
			"datum": datum,
			"assets": assets
		})


class AsteriaData:
	var id: String = ""
	var totalRewards: int = 0
	var position: Vector2 = Vector2(0, 0)
	var datum: String = ""
	var assets: Variant = []
	
	func _init(_id: String, _totalRewards: int, _position: Vector2, _datum: String, _assets: Variant):
		id = _id
		totalRewards = _totalRewards
		position = _position
		datum = _datum
		assets = _assets
	
	func json() -> String:
		return JSON.stringify({
			"tx": id,
			"type": "asteria",
			"totalRewards": totalRewards,
			"position": {
				"x": position.x,
				"y": position.y
			},
			"datum": datum,
			"assets": assets
		})
