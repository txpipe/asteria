extends Panel

signal minimap_position_changed(position: Vector2)

var camera_position = Vector2(0, 0)
var camera_zoom = Vector2(1, 1)
var minimap_mode = "fuel"

var is_mouse_pressed = false
var mouse_pressed_timer = Timer.new()
const mouse_pressed_threshold: float = 0.2


func _draw():
	var grid_size = Vector2(Global.get_grid_size(), Global.get_grid_size())
	var map_scale = size / grid_size
	var cell_size = Vector2(Global.get_cell_size(), Global.get_cell_size())
	var viewport_scale = Vector2(get_viewport().size) / cell_size * map_scale / camera_zoom
	var camera_position_scale = camera_position / cell_size * map_scale
	var map_position = Vector2(size.x/2, size.y/2)
	
	if minimap_mode == "ship":
		for ship in Global.get_ships():
			draw_circle(ship.position*map_scale+map_position, 2, Color("#2EBA00"), true, 0, true)
	
	if minimap_mode == "fuel":
		for fuel in Global.get_fuels():
			draw_circle(fuel.position*map_scale+map_position, 2, Color("#7982FD"), true, 0, true)
	
	draw_rect(Rect2(camera_position_scale+map_position-viewport_scale/2, viewport_scale), Color("#FE1562", .3), true, -1, true)


func _input(event):
	if event is InputEventMouseButton:
		is_mouse_pressed = event.pressed && is_mouse_inside()
		if is_mouse_pressed:
			if mouse_pressed_timer.is_stopped():
				mouse_pressed_timer.start(mouse_pressed_threshold)
			update_map_position()
		else:
			if !mouse_pressed_timer.is_stopped():
				mouse_pressed_timer.stop()
	elif event is InputEventMouseMotion:
		if is_mouse_pressed && is_mouse_inside():
			if mouse_pressed_timer.is_stopped():
				update_map_position()


func is_mouse_inside() -> bool:
	return Rect2(global_position, size).has_point(get_viewport().get_mouse_position())


func update_map_position() -> void:
	minimap_position_changed.emit((get_viewport().get_mouse_position() - global_position) / size * Vector2(2,2) - Vector2(1,1))


func _on_main_dataset_updated() -> void:
	queue_redraw()


func _on_map_camera_position_changed(position: Vector2) -> void:
	camera_position = position
	queue_redraw()


func _on_map_camera_zoom_changed(zoom: Vector2) -> void:
	camera_zoom = zoom
	queue_redraw()


func _on_ship_button_toggled(toggled_on: bool) -> void:
	minimap_mode = "ship"
	queue_redraw()


func _on_fuel_button_toggled(toggled_on: bool) -> void:
	minimap_mode = "fuel"
	queue_redraw()


func _on_token_button_toggled(toggled_on: bool) -> void:
	minimap_mode = "token"
	queue_redraw()
