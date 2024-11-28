extends Sprite2D


func _draw():
	var grid_size = Global.get_grid_size()
	var cell_size = Global.get_cell_size()
	
	for i in range(4, grid_size/2, 4):
		draw_circle(Vector2(0, 0), i * cell_size + (cell_size/2), Color("#FFF75D", .15), false, 2, true)
	
	# TODO: Improve this
	for i in range(grid_size/2+2, grid_size/(PI/2)+PI, 4):
		var opacity = (round(grid_size/(PI/2)+PI)-i-2)/(round(grid_size/(PI/2)+PI)-grid_size/2-2) * .15
		draw_circle(Vector2(0, 0), i * cell_size + (cell_size/2), Color("#FFF75D", opacity), false, 2, true)
