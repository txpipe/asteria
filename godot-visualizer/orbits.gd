extends Sprite2D

const cell_size = 128
const grid_size = 50

var draw_grid = false

func _draw():
	
	for i in range(1, grid_size/2, 2):
		draw_circle(Vector2(0, 0), i * cell_size + (cell_size/2), Color(255, 247, 93, .2), false, 2, true)
	
	# TODO: Improve this
	for i in range(grid_size/2, grid_size/(PI/2)+PI, 2):
		var opacity = (round(grid_size/(PI/2)+PI)-i-2)/(round(grid_size/(PI/2)+PI)-grid_size/2-2) * .2
		draw_circle(Vector2(0, 0), i * cell_size + (cell_size/2), Color(255, 247, 93, opacity), false, 2, true)
	
	# TODO: This is only a reference grid, it should be removed in the future
	if draw_grid:
		const min_range = -grid_size / 2 * cell_size
		const max_range = (grid_size + 2) / 2 * cell_size
		const size = Vector2(cell_size, cell_size) / 2
		for i in range(min_range, max_range+cell_size, cell_size):
			draw_line(Vector2(min_range, i)-size, Vector2(max_range, i)-size, Color(255,255,255,.2), 1, true)
			draw_line(Vector2(i, min_range)-size, Vector2(i, max_range)-size, Color(255,255,255,.2), 1, true)


# TODO: This is only to show the reference grid, it should be removed in the future
func _process(delta: float) -> void:
	if Input.is_action_just_released("ui_down"):
		draw_grid = !draw_grid
		queue_redraw()
