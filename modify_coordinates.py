import json
import random
import sys

def modify_coordinates(file_path):
    with open(file_path, 'r') as f:
        fauna_data = json.load(f)

    modified_species_count = 0
    for category_name, subcategories in fauna_data.items():
        for subcategory in subcategories:
            # Group species by their original coordinates
            coords_to_species = {}
            for species in subcategory['species']:
                if 'coordinates' in species:
                    # Round coordinates to a fixed precision for key generation
                    lat = round(species['coordinates']['lat'], 4)
                    lng = round(species['coordinates']['lng'], 4)
                    coord_key = f"{lat},{lng}"
                    if coord_key not in coords_to_species:
                        coords_to_species[coord_key] = []
                    coords_to_species[coord_key].append(species)

            # Modify coordinates for species that share them
            for coord_key, species_list in coords_to_species.items():
                if len(species_list) > 1:
                    # Keep the first species' coordinates as is, modify others
                    original_lat = species_list[0]['coordinates']['lat']
                    original_lng = species_list[0]['coordinates']['lng']

                    for i in range(1, len(species_list)):
                        species = species_list[i]
                        # Generate random offsets within +/- 1.0
                        # To ensure they don't exceed 1.0, we can use a smaller range for the random number
                        # and then scale it. For example, random.uniform(-0.9, 0.9)
                        lat_offset = random.uniform(-0.999, 0.999)
                        lng_offset = random.uniform(-0.999, 0.999)

                        new_lat = original_lat + lat_offset
                        new_lng = original_lng + lng_offset

                        species['coordinates']['lat'] = new_lat
                        species['coordinates']['lng'] = new_lng
                        modified_species_count += 1

    with open(file_path, 'w') as f:
        json.dump(fauna_data, f, indent=2)

    print(f"Modified coordinates for {modified_species_count} species.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        modify_coordinates(sys.argv[1])
    else:
        print("Usage: python modify_coordinates.py <path_to_fauna_json>")
