extends Camera2D

var is_mouse_pressed
var curr_mouse_position
var prev_mouse_position
var next_camera_position = null
var prev_camera_position = position

var mouse_pressed_timer = Timer.new()
const mouse_pressed_threshold: float = 0.2
const camera_drag: float = 0.05


func _ready():
	mouse_pressed_timer.one_shot = true
	add_child(mouse_pressed_timer)

	prev_mouse_position = get_viewport().get_mouse_position()

func _process(delta):
	curr_mouse_position = get_viewport().get_mouse_position()
	if is_mouse_pressed:
		next_camera_position = position - (curr_mouse_position - prev_mouse_position) / zoom
	elif next_camera_position: position = position + (next_camera_position - position) * camera_drag
	prev_mouse_position = curr_mouse_position

func _input(event):
	if event is InputEventMouseButton:
		is_mouse_pressed = event.pressed
		if is_mouse_pressed:
			if mouse_pressed_timer.is_stopped():
				mouse_pressed_timer.start(mouse_pressed_threshold)
		else:
			if !mouse_pressed_timer.is_stopped():
				mouse_pressed_timer.stop()
	elif event is InputEventMouseMotion:
		if is_mouse_pressed:
			if mouse_pressed_timer.is_stopped():
				prev_camera_position -= event.relative / zoom
				position = prev_camera_position
		else:
			prev_camera_position = position
