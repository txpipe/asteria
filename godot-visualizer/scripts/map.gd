extends Node2D

@export var asteria_scene: PackedScene

signal camera_position_changed(position: Vector2)
signal camera_zoom_changed(zoom: Vector2)
signal minimap_position_changed(position: Vector2)
signal selected_ship_position_changed(position: Vector2)
signal mouse_hover_gui(is_hover: bool)
signal hide_tooltip()
signal show_ship_tooltip(ship: Global.ShipData)
signal show_token_tooltip(token: Global.TokenData)
signal show_fuel_tooltip(fuel: Global.PelletData)
signal show_asteria_tooltip(asteria: Global.AsteriaData)

var mouse_entered_minimap = false
var mouse_entered_minimap_control = false

var current = null
var pressed_position = null

var tween_alpha = null
var tween_position = null
var placeholder_move = null

var placeholder_ship_position = null
var placeholder_ship = null

var initial_position = Vector2(0, 0)

func _on_main_dataset_updated() -> void:
	const center = Vector2(0, 0)
	var cell_size = Vector2(Global.get_cell_size(), Global.get_cell_size())
	var alpha = 1 if Global.get_mode() == "map" else 0.5
	
	for child in $Entities.get_children():
		if child != placeholder_move and child != placeholder_ship:
			child.free()
	
	var asteria = asteria_scene.instantiate()
	asteria.position = Global.get_asteria().position * cell_size
	$Entities.add_child(asteria)
	
	for pellet_data in Global.get_pellets():
		var pellet = Token.new_token("pellet")
		pellet.position = pellet_data.position * cell_size
		pellet.rotation = (7.5 - int(pellet_data.position.x * pellet_data.position.y) % 15) * PI/180
		pellet.modulate.a = alpha
		$Entities.add_child(pellet)
	
	for token_data in Global.get_tokens():
		var token = Token.new_token(token_data.name)
		token.position = token_data.position * cell_size
		token.modulate.a = alpha
		$Entities.add_child(token)
	
	for ship_data in Global.get_ships():
		var ship = Ship.new_ship(ship_data)
		ship.position = ship_data.position * cell_size
		ship.rotation = ship.position.angle_to_point(center) + PI/2
		ship.modulate.a = alpha
		$Entities.add_child(ship)
		
		if Global.get_selected_ship() != null and Global.get_selected_ship().id == ship_data.id:
			ship.modulate.a = 1
			
			if Global.get_selected_ship().position != ship_data.position:
				ship.position = Global.get_selected_ship().position * cell_size
				ship.rotation = ship.position.angle_to_point(ship_data.position * cell_size) + PI/2
				
				var tween = get_tree().create_tween()
				tween.tween_property(ship, "position", ship_data.position * cell_size, .5)
				tween.tween_property(ship, "rotation", ship.position.angle_to_point(center) + PI/2, .5)
				tween.play()
				
				Global.set_selected_ship(ship_data)
				selected_ship_position_changed.emit(ship_data.position * Global.get_cell_size() + initial_position)
				_on_next_position_reset()


func get_current_position() -> Variant:
	var cell_size = Global.get_cell_size()
	var mouse_position = get_viewport().get_mouse_position() / $Camera.zoom
	var viewport_rect = Rect2(Vector2(0,0), get_viewport_rect().size / $Camera.zoom)
	
	if viewport_rect.has_point(mouse_position) && !is_mouse_hover_gui():
		return round((mouse_position - Vector2(get_viewport_rect().size / $Camera.zoom) / 2 + $Camera.position) / cell_size)
	else:
		return null

func _input(event):
	if event is InputEventMouseButton and event.pressed:
		pressed_position = get_current_position()
	
	if event is InputEventMouseButton and !event.pressed:
		var current_position = get_current_position()
		if pressed_position == current_position and pressed_position != null:
			JavaScriptBridge.eval(
				"parent.window.postMessage({ action: 'map_click', position: { x: %s, y: %s }, payload: %s })"
				% [pressed_position.x, pressed_position.y, current.json() if current != null else "null"]
			)


func _process(delta: float) -> void:
	var cell_size = Global.get_cell_size()
	var mouse_position = get_viewport().get_mouse_position() / $Camera.zoom
	var viewport_rect = Rect2(Vector2(0,0), get_viewport_rect().size / $Camera.zoom)
	
	if viewport_rect.has_point(mouse_position) && !is_mouse_hover_gui():
		var cell_position = round((mouse_position - Vector2(get_viewport_rect().size / $Camera.zoom) / 2 + $Camera.position) / cell_size)
		$Cell.position = cell_position * cell_size
		
		var asteria = Global.get_asteria()
		var ships = Global.get_ships().filter(func(ship): return ship.position == cell_position)
		var tokens = Global.get_tokens().filter(func(token): return token.position == cell_position)
		var pellets = Global.get_pellets().filter(func(pellet): return pellet.position == cell_position)
		
		if asteria and asteria.position == cell_position:
			$Cell.animation = "filled"
			show_asteria_tooltip.emit(asteria)
			current = asteria
		elif ships.size() > 0:
			$Cell.animation = "filled"
			show_ship_tooltip.emit(ships[0])
			current = ships[0]
		elif tokens.size() > 0:
			$Cell.animation = "filled"
			show_token_tooltip.emit(tokens[0])
			current = tokens[0]
		elif pellets.size() > 0:
			$Cell.animation = "filled"
			show_fuel_tooltip.emit(pellets[0])
			current = pellets[0]
		else:
			$Cell.animation = "empty"
			hide_tooltip.emit()
			current = null
	else:
		hide_tooltip.emit()
		current = null


func is_mouse_hover_gui() -> bool:
	return (mouse_entered_minimap || mouse_entered_minimap_control)


func emit_mouse_hover_gui() -> void:
	mouse_hover_gui.emit(is_mouse_hover_gui())


func _on_camera_position_changed(position: Vector2) -> void:
	camera_position_changed.emit(position)


func _on_minimap_minimap_position_changed(position: Vector2) -> void:
	minimap_position_changed.emit(position)


func _on_minimap_mouse_entered() -> void:
	mouse_entered_minimap = true
	emit_mouse_hover_gui()


func _on_minimap_mouse_exited() -> void:
	mouse_entered_minimap = false
	emit_mouse_hover_gui()


func _on_minimap_control_panel_mouse_entered() -> void:
	mouse_entered_minimap_control = true
	emit_mouse_hover_gui()


func _on_minimap_control_panel_mouse_exited() -> void:
	mouse_entered_minimap_control = false
	emit_mouse_hover_gui()


func _on_zoom_less_button_pressed() -> void:
	if $Camera.zoom > Vector2(0.5, 0.5):
		$Camera.zoom -= Vector2(.25, .25)
		camera_zoom_changed.emit($Camera.zoom)


func _on_zoom_plus_button_pressed() -> void:
	if $Camera.zoom < Vector2(1.5, 1.5):
		$Camera.zoom += Vector2(.25, .25)
		camera_zoom_changed.emit($Camera.zoom)


func _on_follow_ship_reset() -> void:
	selected_ship_position_changed.emit(initial_position)
	Global.set_selected_ship(null)
	_on_next_position_reset()
	_on_main_dataset_updated()


func _on_follow_ship_selected(ship_number: String) -> void:
	var data = Global.get_ships().filter(func(ship): return ship.shipTokenName.hex_decode().get_string_from_utf8() == "SHIP%s" % ship_number)
	if (len(data) > 0):
		var ship_data = data[0]
		selected_ship_position_changed.emit(ship_data.position * Global.get_cell_size() + initial_position)
		Global.set_selected_ship(ship_data)
		_on_main_dataset_updated()


func _on_next_position_reset() -> void:
	if tween_alpha != null:
		tween_alpha.stop()
		tween_position.stop()
	
	if placeholder_move != null:
		placeholder_move.free()
		placeholder_move = null


func _on_next_position_selected(position: Vector2) -> void:
	if Global.get_selected_ship() != null:
		var ship_data = Global.get_selected_ship()
		
		var old_position = ship_data.position * Global.get_cell_size()
		var new_position = position * Global.get_cell_size()
		
		if placeholder_move != null:
			placeholder_move.free()
		
		placeholder_move = Ship.new_ship(ship_data)
		$Entities.add_child(placeholder_move)
		
		placeholder_move.animation = str(ship_data.id.unicode_at(ship_data.id.length()-3) % 7)
		placeholder_move.position = old_position
		placeholder_move.rotation = old_position.angle_to_point(new_position) + PI/2
		placeholder_move.modulate.a = 0
		
		if tween_alpha != null:
			tween_alpha.stop()
			tween_position.stop()
		
		tween_alpha = get_tree().create_tween().set_loops()
		tween_alpha.tween_property(placeholder_move, "modulate:a", .75, 1).from(0)
		tween_alpha.tween_property(placeholder_move, "modulate:a", 0, 1).from(.75)
		tween_alpha.play()
		
		tween_position = get_tree().create_tween().set_loops()
		tween_position.tween_property(placeholder_move, "position", new_position, 1).from(old_position)
		tween_position.tween_property(placeholder_move, "position", old_position, 1).from(new_position)
		tween_position.play()


func _on_init_joystick_mode() -> void:
	initial_position = Vector2(-$Camera.get_viewport_rect().size.x/4, 0)
	selected_ship_position_changed.emit(initial_position)


func _on_current_position_selected(position: Vector2) -> void:
	selected_ship_position_changed.emit(position * Global.get_cell_size() + initial_position)


func _on_placeholder_ship_reset() -> void:
	placeholder_ship_position = null
	
	if placeholder_ship != null:
		placeholder_ship.free()
		placeholder_ship = null


func _on_placeholder_ship_created(position: Vector2) -> void:
	placeholder_ship_position = position
	
	if placeholder_ship == null:
		placeholder_ship = Ship.new_ship_with_frame_id("0")
		$Entities.add_child(placeholder_ship)
	
	placeholder_ship.position = position * Global.get_cell_size()
	placeholder_ship.rotation = placeholder_ship.position.angle_to_point(Vector2(0, 0)) + PI/2
