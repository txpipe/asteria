extends Node2D


func _ready() -> void:
	$AnimatedSprite2D.play(str(randi_range(0, 6)))
