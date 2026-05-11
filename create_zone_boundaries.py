#!/usr/bin/env python3
"""
Create reasonable GeoJSON boundary polygons for Bulawayo suburbs based on coordinates.
Since external Nominatim access is restricted, creates approximate polygons from known zones.
"""
import json
from typing import Dict, List, Tuple

# Non-suburb zones that should keep placeholders
NON_SUBURB_ZONES = {
    "12th Ave Wholesale Corridor",
    "CBD Core",
    "CBD / Sauce Town",
    "Egodini Terminus",
    "Renkini Market"
}

# Zones with their center coordinates
ZONES = [
    {"id":"75c0d949-bd65-49f1-80f6-206909e3dfac","name":"12th Ave Wholesale Corridor","lat":-20.153,"lng":28.573},
    {"id":"e90cd624-92ba-4659-bb9d-72cdc5efa67a","name":"Ascot","lat":-20.130,"lng":28.608},
    {"id":"3f3d9547-ca11-48c7-8a0f-39f95af522a0","name":"Belmont Industrial","lat":-20.168,"lng":28.570},
    {"id":"77ac5ffc-3a3b-4868-a1b1-0ab84473870c","name":"CBD / Sauce Town","lat":-20.1340,"lng":28.5890},
    {"id":"8343596a-2a7c-4e85-99f1-b02c7715d168","name":"CBD Core","lat":-20.150,"lng":28.583},
    {"id":"0a54a8b4-c84e-4cba-8d7f-b3e76ca44e42","name":"Cowdray Park","lat":-20.200,"lng":28.490},
    {"id":"37e3ea33-cb08-403d-b50e-8e1ee888e165","name":"Donnington Industrial","lat":-20.140,"lng":28.550},
    {"id":"4057ef95-03b4-47aa-b306-4e320e46091e","name":"Egodini Terminus","lat":-20.153,"lng":28.577},
    {"id":"3e45e529-6e08-48ab-b080-7b0cdbc531e4","name":"Entumbane","lat":-20.165,"lng":28.537},
    {"id":"ae552f07-18ad-4111-9bdc-2c62d999d13b","name":"Hurrisvale","lat":-20.175,"lng":28.610},
    {"id":"18fbe887-2267-4785-901b-54f3ab33bec6","name":"Kelvin Industrial","lat":-20.170,"lng":28.540},
    {"id":"5c548bd1-1c6a-4af7-9d67-6988cc9b9ce9","name":"Kenilworth","lat":-20.128,"lng":28.600},
    {"id":"775c4a97-a6fc-499a-a825-1fd3df79dcd4","name":"Killarney","lat":-20.120,"lng":28.615},
    {"id":"cd046fd6-5eec-4bc8-b718-4a23041e6f0d","name":"Kumalo","lat":-20.160,"lng":28.598},
    {"id":"7c1c7ed5-034b-4ff2-a4a8-5a78a2556e82","name":"Luveve","lat":-20.115,"lng":28.520},
    {"id":"c08b97d3-04fb-47a8-b10b-d023023f3ffa","name":"Magwegwe","lat":-20.155,"lng":28.535},
    {"id":"569c3b92-4287-48d1-9a84-3d3e7d7d63b0","name":"Mahatshula","lat":-20.105,"lng":28.505},
    {"id":"9c1b99a4-8917-4079-a7e4-61643373bfa3","name":"Makhandeni","lat":-20.140,"lng":28.530},
    {"id":"ac16b0cf-4f92-4e1b-b855-e258d29cef74","name":"Makokoba","lat":-20.148,"lng":28.570},
    {"id":"81400bae-e12d-4032-8a22-9f76e76fb5df","name":"Matshobane","lat":-20.152,"lng":28.575},
    {"id":"7d0cc4e6-0a3a-4065-8cd0-88822d034c18","name":"Mzilikazi","lat":-20.143,"lng":28.568},
    {"id":"5bdf3e1d-71fc-47d2-9e00-bdffb5693b5d","name":"Njube","lat":-20.1321,"lng":28.5287},
    {"id":"746083c9-1246-484c-89b4-f1bcd7f84e74","name":"Nketa","lat":-20.195,"lng":28.530},
    {"id":"bfe50f4a-f171-4100-ae89-eecbd377172e","name":"Nkulumane","lat":-20.164,"lng":28.516},
    {"id":"034366f6-a3f0-4271-9f75-510973ddaa2a","name":"Northern","lat":-20.122,"lng":28.595},
    {"id":"50c796f2-7ff0-4af1-bca7-9fb0ef419476","name":"Pardonhurst","lat":-20.132,"lng":28.610},
    {"id":"00ee887e-1706-41fe-837d-3359dedf8ff9","name":"Parklands","lat":-20.140,"lng":28.615},
    {"id":"e07da959-0857-4e59-9244-3a52dba4bc85","name":"Pumula","lat":-20.185,"lng":28.540},
    {"id":"a4238129-1fd2-4b69-be5e-1bd85ca6d33e","name":"Queens Park","lat":-20.145,"lng":28.605},
    {"id":"d475bd37-0247-4195-8e8c-27234dd074b8","name":"Renkini Market","lat":-20.142,"lng":28.577},
    {"id":"8304295f-6381-47bd-9936-75dd6e955162","name":"Richmond","lat":-20.160,"lng":28.605},
    {"id":"b842d700-1696-4796-8a1c-45e3780f0edf","name":"Sizinda","lat":-20.1729,"lng":28.5433},
    {"id":"afae46df-f203-4902-8079-41b890e7bee8","name":"Steeldale/Thorngrove","lat":-20.140,"lng":28.570},
    {"id":"d2d480a9-2994-4268-8ea7-6387994f0397","name":"Tegela","lat":-20.158,"lng":28.558},
    {"id":"486aa625-078e-4d14-8668-0553fc2d31a9","name":"Trenance","lat":-20.168,"lng":28.612},
]


def create_approximate_polygon(center_lat: float, center_lng: float, size: float = 0.008) -> Dict:
    """
    Create an approximate rectangular polygon around a center point.
    Size controls the radius of the polygon (in degrees, ~0.8km per 0.008 degrees).
    """
    half_size = size / 2
    corners = [
        [center_lng - half_size, center_lat - half_size],  # SW
        [center_lng + half_size, center_lat - half_size],  # SE
        [center_lng + half_size, center_lat + half_size],  # NE
        [center_lng - half_size, center_lat + half_size],  # NW
        [center_lng - half_size, center_lat - half_size],  # Close polygon
    ]

    return {
        "type": "Polygon",
        "coordinates": [corners]
    }


def main():
    print("Creating approximate zone boundaries for Bulawayo suburbs...")
    print(f"Total zones to process: {len(ZONES)}\n")

    updated_zones = []
    skipped_zones = []
    sql_updates = []

    for i, zone in enumerate(ZONES):
        zone_id = zone["id"]
        zone_name = zone["name"]
        lat = float(zone["lat"])
        lng = float(zone["lng"])

        # Skip non-suburb zones
        if zone_name in NON_SUBURB_ZONES:
            print(f"[{i+1}/{len(ZONES)}] {zone_name}: SKIPPED (non-suburb)")
            skipped_zones.append((zone_name, "Non-suburb zone"))
            continue

        print(f"[{i+1}/{len(ZONES)}] {zone_name}...", end=" ", flush=True)

        # Create approximate polygon
        polygon = create_approximate_polygon(lat, lng)

        # Build SQL update
        geojson_str = json.dumps(polygon).replace("'", "''")
        sql = f"UPDATE public.zones SET boundary_geojson = '{geojson_str}' WHERE id = '{zone_id}';"
        sql_updates.append(sql)

        updated_zones.append(zone_name)
        print("CREATED")

    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\nCreated boundaries: {len(updated_zones)}")
    for zone in updated_zones:
        print(f"  ✓ {zone}")

    print(f"\nSkipped: {len(skipped_zones)}")
    for zone_name, reason in skipped_zones:
        print(f"  ✗ {zone_name} ({reason})")

    print(f"\nTotal: {len(ZONES)} zones")

    # Save SQL updates
    if sql_updates:
        with open("zone_updates.sql", "w") as f:
            f.write("\n".join(sql_updates))
        print(f"\nGenerated {len(sql_updates)} SQL updates in zone_updates.sql")


if __name__ == "__main__":
    main()
