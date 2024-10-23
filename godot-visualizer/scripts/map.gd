extends Node2D

@export var ship_scene: PackedScene
@export var fuel_scene: PackedScene
@export var token_scene: PackedScene
@export var asteria_scene: PackedScene

signal camera_position_changed(position: Vector2)
signal camera_zoom_changed(zoom: Vector2)
signal minimap_position_changed(position: Vector2)
signal mouse_hover_gui(is_hover: bool)

var mouse_entered_sidebar = false
var mouse_entered_minimap = false
var mouse_entered_minimap_control = false
var mouse_entered_modal = false


func _on_main_dataset_updated() -> void:
	const center = Vector2(0, 0)
	var cell_size = Vector2(Global.get_cell_size(), Global.get_cell_size())
	
	for ship_data in Global.get_ships():
		var ship = ship_scene.instantiate()
		ship.position = ship_data.position * cell_size
		ship.rotation = ship.position.angle_to_point(center) + PI/2
		$Entities.add_child(ship)
	
	for fuel_data in Global.get_fuels():
		var fuel = fuel_scene.instantiate()
		fuel.position = fuel_data.position * cell_size
		$Entities.add_child(fuel)
	
	var asteria = asteria_scene.instantiate()
	asteria.position = Global.get_asteria().position * cell_size
	$Entities.add_child(asteria)


func _process(delta: float) -> void:
	var cell_size = Global.get_cell_size()
	var mouse_position = get_viewport().get_mouse_position()
	var viewport_rect = Rect2(Vector2(0,0), get_viewport_rect().size)
	
	if viewport_rect.has_point(mouse_position) && !is_mouse_hover_gui():
		var cell_position = round((mouse_position - Vector2(get_viewport_rect().size) / 2 + $Camera.position) / cell_size)
		$Cell.position = cell_position * cell_size
		
		var ships = Global.get_ships().filter(func(ship): return ship.position == cell_position)
		var fuels = Global.get_fuels().filter(func(fuel): return fuel.position == cell_position)
		
		if ships.size() > 0 or fuels.size() > 0:
			$Cell.animation = "filled"
			$Cell/Tooltip.visible = true
			if ships.size() > 0:
				$Cell/Tooltip/MarginContainer/VBoxContainer/Title.text = "SHIP"
				$Cell/Tooltip/MarginContainer/VBoxContainer/Position.text = "Position | %d, %d" % [ships[0].position.x, ships[0].position.y]
				$Cell/Tooltip/MarginContainer/VBoxContainer/Address.text = "Address | %s" % ships[0].id
				$Cell/Tooltip/MarginContainer/VBoxContainer/Address.visible = true
				$Cell/Tooltip/MarginContainer/VBoxContainer/Coins.visible = true
			else:
				$Cell/Tooltip/MarginContainer/VBoxContainer/Title.text = "FUEL PELLET"
				$Cell/Tooltip/MarginContainer/VBoxContainer/Position.text = "Position | %d, %d" % [fuels[0].position.x, fuels[0].position.y]
				$Cell/Tooltip/MarginContainer/VBoxContainer/Address.visible = false
				$Cell/Tooltip/MarginContainer/VBoxContainer/Coins.visible = false
		else:
			$Cell.animation = "empty"
			$Cell/Tooltip.visible = false
		
		$Cell.visible = true
	else:
		$Cell.visible = false


func is_mouse_hover_gui() -> bool:
	return (mouse_entered_sidebar ||
		mouse_entered_minimap ||
		mouse_entered_minimap_control ||
		mouse_entered_modal)


func emit_mouse_hover_gui() -> void:
	mouse_hover_gui.emit(is_mouse_hover_gui())


func _on_camera_position_changed(position: Vector2) -> void:
	camera_position_changed.emit(position)


func _on_minimap_minimap_position_changed(position: Vector2) -> void:
	minimap_position_changed.emit(position)


func _on_sidebar_panel_mouse_entered() -> void:
	mouse_entered_sidebar = true
	emit_mouse_hover_gui()


func _on_sidebar_panel_mouse_exited() -> void:
	mouse_entered_sidebar = false
	emit_mouse_hover_gui()


func _on_modal_panel_mouse_entered() -> void:
	mouse_entered_modal = true
	emit_mouse_hover_gui()


func _on_modal_panel_mouse_exited() -> void:
	mouse_entered_modal = false
	emit_mouse_hover_gui()


func _on_minimap_mouse_entered() -> void:
	mouse_entered_minimap = true
	emit_mouse_hover_gui()


func _on_minimap_mouse_exited() -> void:
	mouse_entered_minimap = false
	emit_mouse_hover_gui()


func _on_minimap_control_panel_mouse_entered() -> void:
	mouse_entered_modal = true
	emit_mouse_hover_gui()


func _on_minimap_control_panel_mouse_exited() -> void:
	mouse_entered_modal = false
	emit_mouse_hover_gui()
