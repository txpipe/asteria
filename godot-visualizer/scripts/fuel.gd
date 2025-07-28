class_name Fuel
extends Node2D

const scene: PackedScene = preload("res://scenes/fuel.tscn")

var animation: String = "inactive"


static func new_fuel() -> Fuel:
	var fuel: Fuel = scene.instantiate()
	fuel.animation = "inactive"
	return fuel


func _ready() -> void:
	$AnimatedSprite2D.play(animation)


func _on_mouse_entered() -> void:
	animation = "active"
	$AnimatedSprite2D.play(animation)


func _on_mouse_exited() -> void:
	animation = "inactive"
	$AnimatedSprite2D.play(animation)
