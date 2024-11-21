class_name Ship
extends Node2D

const scene: PackedScene = preload("res://scenes/ship.tscn")

var animation: String = "0"


static func new_ship(data: Global.ShipData) -> Ship:
	var ship: Ship = scene.instantiate()
	ship.animation = str(data.id.unicode_at(data.id.length()-3) % 7)
	return ship


func _ready() -> void:
	$AnimatedSprite2D.play(animation)
