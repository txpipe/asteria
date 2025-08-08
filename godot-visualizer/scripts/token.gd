class_name Token
extends Node2D

const scene: PackedScene = preload("res://scenes/token.tscn")

var token_name: String = ""


static func new_token(_token_name: String) -> Token:
	var token: Token = scene.instantiate()
	token.token_name = _token_name
	return token


func _ready() -> void:
	modulate.a = 0.5 if token_name == "pellet" else 0.75
	$AnimatedSprite2D.play(token_name)


func _on_mouse_entered() -> void:
	modulate.a = 1


func _on_mouse_exited() -> void:
	modulate.a = 0.5 if token_name == "pellet" else 0.75
