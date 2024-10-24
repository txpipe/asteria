extends Node

signal dataset_updated

const radius = 1000

const url = "https://8000-skillful-employee-kb9ou6.us1.demeter.run/graphql"
const headers = ["Content-Type: application/json"]
const query = """
{
	objectsInRadius(center: { x: 0, y: 0 }, radius: %s) {
		__typename,
		... on Ship {
			id,
			position {
				x,
				y
			}
		},
		... on Fuel {
			fuel,
			position {
				x,
				y
			}
		},
		... on Asteria {
			totalRewards,
			position {
				x,
				y
			}
		}
	}
}
""" % radius


func _ready():
	$HTTPRequest.request_completed.connect(_on_request_completed)
	$HTTPRequest.request(url, headers, HTTPClient.METHOD_POST, JSON.stringify({ "query": query }))


func _on_request_completed(result, response_code, headers, body):
	var json = JSON.parse_string(body.get_string_from_utf8())
	Global.init_data(json)
	dataset_updated.emit()


func update_tooltip_position(position: Vector2) -> void:
	var cell_size = Vector2(Global.get_cell_size(), Global.get_cell_size()) * $MapCanvasLayer/Map/Camera.zoom
	var camera_position = $MapCanvasLayer/Map/Camera.position * $MapCanvasLayer/Map/Camera.zoom
	var tooltip_offset = Vector2($GUICanvasLayer/Tooltip.size.x / 2, $GUICanvasLayer/Tooltip.size.y + cell_size.y)
	var viewport_size = Vector2($MapCanvasLayer/Map.get_viewport_rect().size) / 2
	var tooltip_position = position * cell_size - camera_position - tooltip_offset + viewport_size
	
	if tooltip_position.x < 10:
		tooltip_offset.x = -cell_size.x
		tooltip_offset.y = $GUICanvasLayer/Tooltip.size.y / 2
	elif tooltip_position.x > $MapCanvasLayer/Map.get_viewport_rect().size.x - $GUICanvasLayer/Tooltip.size.x - 10:
		tooltip_offset.x = $GUICanvasLayer/Tooltip.size.x + cell_size.x
		tooltip_offset.y = $GUICanvasLayer/Tooltip.size.y / 2
	elif tooltip_position.y < 10:
		tooltip_offset.y = -cell_size.y
	
	tooltip_position = position * cell_size - camera_position - tooltip_offset + viewport_size
	if tooltip_position.y < 10:
		tooltip_position.y = 10
	
	$GUICanvasLayer/Tooltip.position = tooltip_position
	$GUICanvasLayer/Tooltip.visible = true


func _on_map_hide_tooltip() -> void:
	$GUICanvasLayer/Tooltip.visible = false


func _on_map_show_ship_tooltip(position: Vector2, address: String) -> void:
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "SHIP"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Position.text = "Position | %d, %d" % [position.x, position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Address.text = "Address | %s" % address
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Address.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Coins.visible = true
	update_tooltip_position(position)


func _on_map_show_fuel_tooltip(position: Vector2) -> void:
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "FUEL PELLET"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Position.text = "Position | %d, %d" % [position.x, position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Address.visible = false
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Coins.visible = false
	update_tooltip_position(position)
