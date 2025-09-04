import json
import sys

def count_shared_coordinates(file_path):
    with open(file_path, 'r') as f:
        fauna_data = json.load(f)

    coordinate_counts = {}
    for category_name, subcategories in fauna_data.items():
        for subcategory in subcategories:
            for species in subcategory['species']:
                if 'coordinates' in species:
                    # Round coordinates to a fixed precision for key generation
                    lat = round(species['coordinates']['lat'], 4)
                    lng = round(species['coordinates']['lng'], 4)
                    coord_key = f"{lat},{lng}"
                    coordinate_counts[coord_key] = coordinate_counts.get(coord_key, 0) + 1

    shared_coordinates_info = []
    total_shared_species = 0
    for coord_key, count in coordinate_counts.items():
        if count > 1:
            shared_coordinates_info.append(f"Coordinates {coord_key}: {count} species")
            total_shared_species += count

    print(f"Number of species sharing the same coordinates: {total_shared_species}")
    if shared_coordinates_info:
        print("Details:")
        for info in shared_coordinates_info:
            print(f"- {info}")
    else:
        print("No species share the same coordinates.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        count_shared_coordinates(sys.argv[1])
    else:
        print("Usage: python count_shared_coords.py <path_to_fauna_json>")
