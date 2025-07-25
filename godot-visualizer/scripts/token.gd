class_name Token
extends Node2D

const scene: PackedScene = preload("res://scenes/token.tscn")

var token_name: String = ""
var animation: String = "inactive"


static func new_token(_token_name: String) -> Token:
	var token: Token = scene.instantiate()
	token.token_name = _token_name
	token.animation = "inactive"
	return token


func _ready() -> void:
	$AnimatedSprite2D.play("%s_%s" % [token_name, animation])


func _on_mouse_entered() -> void:
	animation = "active"
	$AnimatedSprite2D.play("%s_%s" % [token_name, animation])


func _on_mouse_exited() -> void:
	animation = "inactive"
	$AnimatedSprite2D.play("%s_%s" % [token_name, animation])
