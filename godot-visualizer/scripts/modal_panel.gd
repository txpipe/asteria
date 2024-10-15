extends Panel


var mode = null


func _on_close_button_pressed() -> void:
	visible = false
	mode = null


func _on_move_button_pressed() -> void:
	if mode != "move":
		visible = true
		mode = "move"
		$MarginContainer/VBoxContainer/MarginContainer/HBoxContainer/TitleLabel.text = "MOVE"
	else:
		visible = false
		mode = null


func _on_gather_fuel_button_pressed() -> void:
	if mode != "gather-fuel":
		visible = true
		mode = "gather-fuel"
		$MarginContainer/VBoxContainer/MarginContainer/HBoxContainer/TitleLabel.text = "GATHER FUEL"
	else:
		visible = false
		mode = null


func _on_mine_token_button_pressed() -> void:
	if mode != "mine-token":
		visible = true
		mode = "mine-token"
		$MarginContainer/VBoxContainer/MarginContainer/HBoxContainer/TitleLabel.text = "MINE TOKEN"
	else:
		visible = false
		mode = null


func _on_copy_button_pressed() -> void:
	DisplayServer.clipboard_set("Sample code")
