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
