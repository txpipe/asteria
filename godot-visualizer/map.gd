extends Node2D

@export var ship_scene: PackedScene
@export var fuel_scene: PackedScene
@export var token_scene: PackedScene

const cell_size = 128
const grid_size = 50

var draw_grid = false
var cells = []


func _ready() -> void:
	const center = Vector2(0, 0)
	const min_range = -grid_size / 2
	const max_range = +grid_size / 2
	
	# TODO: Remove all this test data
	for i in range(10):
		var fuel = fuel_scene.instantiate()
		fuel.position.x = randi_range(min_range, max_range) * cell_size
		fuel.position.y = randi_range(min_range, max_range) * cell_size
		cells.append(fuel.position)
		add_child(fuel)
		
		var token = token_scene.instantiate()
		token.position.x = randi_range(min_range, max_range) * cell_size
		token.position.y = randi_range(min_range, max_range) * cell_size
		cells.append(token.position)
		add_child(token)
		
	for i in range(20):
		var ship = ship_scene.instantiate()
		ship.position.x = randi_range(min_range, max_range) * cell_size
		ship.position.y = randi_range(min_range, max_range) * cell_size
		ship.rotation = ship.position.angle_to_point(center) + PI/2
		cells.append(ship.position)
		add_child(ship)
		
	var token = token_scene.instantiate()
	token.position = center
	cells.append(token.position)
	add_child(token)


# TODO: This is only to show the reference grid, it should be removed in the future
func _draw() -> void:
	if draw_grid:
		const size = Vector2(cell_size, cell_size)
		for cell in cells:
			draw_rect(Rect2(cell-size/2, size), Color(255,0,0), false, 1, true)


# TODO: This is only to show the reference grid, it should be removed in the future
func _process(delta: float) -> void:
	if Input.is_action_just_released("ui_down"):
		draw_grid = !draw_grid
		queue_redraw()
		
	if Input.is_action_just_released("ui_up"):
		$Camera.zoom = Vector2(1, 1)
		
	if Input.is_action_just_released("ui_left"):
		$Camera.zoom -= Vector2(.1, .1)
		
	if Input.is_action_just_released("ui_right"):
		$Camera.zoom += Vector2(.1, .1)
