extends Node

const grid_size = 200
const cell_size = 128

var ships: Array[Ship] = []
var fuels: Array[Fuel] = []
var asteria: Asteria = null


func init_data(data: Variant):
	for item in data["data"]["objectsInRadius"]:
		
		if item["__typename"] == "Ship":
			ships.append(Ship.new(item["id"], Vector2(item["position"]["x"], item["position"]["y"])))
		
		if item["__typename"] == "Fuel":
			fuels.append(Fuel.new(item["fuel"], Vector2(item["position"]["x"], item["position"]["y"])))
		
		if item["__typename"] == "Asteria":
			asteria = Asteria.new(item["totalRewards"], Vector2(item["position"]["x"], item["position"]["y"]))

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


class Ship:
	var id: String = ""
	var position: Vector2 = Vector2(0, 0)
	
	func _init(_id: String, _position: Vector2):
		id = _id
		position = _position


class Fuel:
	var fuel: int = 0
	var position: Vector2 = Vector2(0, 0)
	
	func _init(_fuel: int, _position: Vector2):
		fuel = _fuel
		position = _position


class Asteria:
	var totalRewards: int = 0
	var position: Vector2 = Vector2(0, 0)
	
	func _init(_totalRewards: int, _position: Vector2):
		totalRewards = _totalRewards
		position = _position
