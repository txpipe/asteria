extends Node2D

@export var fuel_scene: PackedScene
@export var token_scene: PackedScene
@export var asteria_scene: PackedScene

signal camera_position_changed(position: Vector2)
signal camera_zoom_changed(zoom: Vector2)
signal minimap_position_changed(position: Vector2)
signal mouse_hover_gui(is_hover: bool)
signal hide_tooltip()
signal show_ship_tooltip(ship: Global.ShipData)
signal show_fuel_tooltip(fuel: Global.FuelData)
signal show_asteria_tooltip(asteria: Global.AsteriaData)

var mouse_entered_sidebar = false
var mouse_entered_minimap = false
var mouse_entered_minimap_control = false
var mouse_entered_modal = false

var current_id = ""

var tween_alpha = null
var tween_position = null
var tween_rotation = null
var placeholder_ship = null

func _on_main_dataset_updated() -> void:
	const center = Vector2(0, 0)
	var cell_size = Vector2(Global.get_cell_size(), Global.get_cell_size())
	
	for child in $Entities.get_children():
		if child != placeholder_ship:
			child.free()
	
	for ship_data in Global.get_ships():
		var ship = Ship.new_ship(ship_data)
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


func _input(event):
	if event is InputEventMouseButton and event.pressed and current_id != "":
		JavaScriptBridge.eval("window.open('%s%s', '_blank')" % [
			Global.get_explorer_url(), current_id.split("#")[0]
		])


func _process(delta: float) -> void:
	var cell_size = Global.get_cell_size()
	var mouse_position = get_viewport().get_mouse_position() / $Camera.zoom
	var viewport_rect = Rect2(Vector2(0,0), get_viewport_rect().size / $Camera.zoom)
	
	if viewport_rect.has_point(mouse_position) && !is_mouse_hover_gui():
		var cell_position = round((mouse_position - Vector2(get_viewport_rect().size / $Camera.zoom) / 2 + $Camera.position) / cell_size)
		$Cell.position = cell_position * cell_size
		
		var asteria = Global.get_asteria()
		var ships = Global.get_ships().filter(func(ship): return ship.position == cell_position)
		var fuels = Global.get_fuels().filter(func(fuel): return fuel.position == cell_position)
		
		if asteria and asteria.position == cell_position:
			$Cell.animation = "filled"
			show_asteria_tooltip.emit(asteria)
			current_id = asteria.id
		elif ships.size() > 0:
			$Cell.animation = "filled"
			show_ship_tooltip.emit(ships[0])
			current_id = ships[0].id
		elif fuels.size() > 0:
			$Cell.animation = "filled"
			show_fuel_tooltip.emit(fuels[0])
			current_id = fuels[0].id
		else:
			$Cell.animation = "empty"
			hide_tooltip.emit()
			current_id = ""
	else:
		hide_tooltip.emit()
		current_id = ""


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


func _on_zoom_less_button_pressed() -> void:
	if $Camera.zoom > Vector2(0.5, 0.5):
		$Camera.zoom -= Vector2(.25, .25)
		camera_zoom_changed.emit($Camera.zoom)


func _on_zoom_plus_button_pressed() -> void:
	if $Camera.zoom < Vector2(1.5, 1.5):
		$Camera.zoom += Vector2(.25, .25)
		camera_zoom_changed.emit($Camera.zoom)


func _on_update_follow() -> void:
	const center = Vector2(0, 0)
	var cell_size = Global.get_cell_size()
	
	if Global.get_mode() == "joystick" and Global.get_follow_ship_id() != null:
		var data = Global.get_ships().filter(func(ship): return ship.id == Global.get_follow_ship_id())
		if (len(data) > 0):
			var ship_data = data[0]
			$Camera.zoom = Vector2(2, 2)
			$Camera.position = ship_data.position * cell_size
			
			if Global.get_follow_position() != null:
				var old_position = ship_data.position * cell_size
				var new_position = Global.get_follow_position() * cell_size
				
				var old_rotation = old_position.angle_to_point(center) + PI/2
				var new_rotation = new_position.angle_to_point(center) + PI/2
				
				if placeholder_ship == null:
					placeholder_ship = Ship.new_ship(ship_data)
					$Entities.add_child(placeholder_ship)
				
				placeholder_ship.animation = str(ship_data.id.unicode_at(ship_data.id.length()-3) % 7)
				placeholder_ship.position = old_position
				placeholder_ship.rotation = old_rotation
				placeholder_ship.modulate.a = 0
				
				if tween_alpha != null:
					tween_alpha.stop()
					tween_position.stop()
					tween_rotation.stop()
				
				tween_alpha = get_tree().create_tween().set_loops()
				tween_alpha.tween_property(placeholder_ship, "modulate:a", .75, 1).from(0)
				tween_alpha.tween_property(placeholder_ship, "modulate:a", 0, 1).from(.75)
				tween_alpha.play()
				
				tween_position = get_tree().create_tween().set_loops()
				tween_position.tween_property(placeholder_ship, "position", new_position, 1).from(old_position)
				tween_position.tween_property(placeholder_ship, "position", old_position, 1).from(new_position)
				tween_position.play()
				
				tween_rotation = get_tree().create_tween().set_loops()
				tween_rotation.tween_property(placeholder_ship, "rotation", new_rotation, 1).from(old_rotation)
				tween_rotation.tween_property(placeholder_ship, "rotation", old_rotation, 1).from(new_rotation)
				tween_rotation.play()
