#!/usr/bin/env python3
"""
Create realistic GeoJSON boundary polygons for Bulawayo suburbs.
Based on known suburb locations and geographic layout of Bulawayo.
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

# Realistic suburb boundaries based on Bulawayo's known geographic layout
# Each suburb is defined by its approximate corner coordinates (SW, SE, NE, NW)
BULAWAYO_SUBURBS = {
    "Ascot": {
        "lat": -20.130,
        "lng": 28.608,
        "corners": [
            (28.600, -20.140),  # SW
            (28.616, -20.140),  # SE
            (28.616, -20.120),  # NE
            (28.600, -20.120),  # NW
        ]
    },
    "Belmont Industrial": {
        "lat": -20.168,
        "lng": 28.570,
        "corners": [
            (28.560, -20.178),
            (28.580, -20.178),
            (28.580, -20.158),
            (28.560, -20.158),
        ]
    },
    "Cowdray Park": {
        "lat": -20.200,
        "lng": 28.490,
        "corners": [
            (28.480, -20.215),
            (28.500, -20.215),
            (28.500, -20.185),
            (28.480, -20.185),
        ]
    },
    "Donnington Industrial": {
        "lat": -20.140,
        "lng": 28.550,
        "corners": [
            (28.540, -20.150),
            (28.560, -20.150),
            (28.560, -20.130),
            (28.540, -20.130),
        ]
    },
    "Entumbane": {
        "lat": -20.165,
        "lng": 28.537,
        "corners": [
            (28.527, -20.175),
            (28.547, -20.175),
            (28.547, -20.155),
            (28.527, -20.155),
        ]
    },
    "Hurrisvale": {
        "lat": -20.175,
        "lng": 28.610,
        "corners": [
            (28.600, -20.185),
            (28.620, -20.185),
            (28.620, -20.165),
            (28.600, -20.165),
        ]
    },
    "Kelvin Industrial": {
        "lat": -20.170,
        "lng": 28.540,
        "corners": [
            (28.530, -20.180),
            (28.550, -20.180),
            (28.550, -20.160),
            (28.530, -20.160),
        ]
    },
    "Kenilworth": {
        "lat": -20.128,
        "lng": 28.600,
        "corners": [
            (28.590, -20.138),
            (28.610, -20.138),
            (28.610, -20.118),
            (28.590, -20.118),
        ]
    },
    "Killarney": {
        "lat": -20.120,
        "lng": 28.615,
        "corners": [
            (28.605, -20.130),
            (28.625, -20.130),
            (28.625, -20.110),
            (28.605, -20.110),
        ]
    },
    "Kumalo": {
        "lat": -20.160,
        "lng": 28.598,
        "corners": [
            (28.588, -20.170),
            (28.608, -20.170),
            (28.608, -20.150),
            (28.588, -20.150),
        ]
    },
    "Luveve": {
        "lat": -20.115,
        "lng": 28.520,
        "corners": [
            (28.510, -20.125),
            (28.530, -20.125),
            (28.530, -20.105),
            (28.510, -20.105),
        ]
    },
    "Magwegwe": {
        "lat": -20.155,
        "lng": 28.535,
        "corners": [
            (28.525, -20.165),
            (28.545, -20.165),
            (28.545, -20.145),
            (28.525, -20.145),
        ]
    },
    "Mahatshula": {
        "lat": -20.105,
        "lng": 28.505,
        "corners": [
            (28.495, -20.115),
            (28.515, -20.115),
            (28.515, -20.095),
            (28.495, -20.095),
        ]
    },
    "Makhandeni": {
        "lat": -20.140,
        "lng": 28.530,
        "corners": [
            (28.520, -20.150),
            (28.540, -20.150),
            (28.540, -20.130),
            (28.520, -20.130),
        ]
    },
    "Makokoba": {
        "lat": -20.148,
        "lng": 28.570,
        "corners": [
            (28.560, -20.158),
            (28.580, -20.158),
            (28.580, -20.138),
            (28.560, -20.138),
        ]
    },
    "Matshobane": {
        "lat": -20.152,
        "lng": 28.575,
        "corners": [
            (28.565, -20.162),
            (28.585, -20.162),
            (28.585, -20.142),
            (28.565, -20.142),
        ]
    },
    "Mzilikazi": {
        "lat": -20.143,
        "lng": 28.568,
        "corners": [
            (28.558, -20.153),
            (28.578, -20.153),
            (28.578, -20.133),
            (28.558, -20.133),
        ]
    },
    "Njube": {
        "lat": -20.1321,
        "lng": 28.5287,
        "corners": [
            (28.5187, -20.1421),
            (28.5387, -20.1421),
            (28.5387, -20.1221),
            (28.5187, -20.1221),
        ]
    },
    "Nketa": {
        "lat": -20.195,
        "lng": 28.530,
        "corners": [
            (28.520, -20.205),
            (28.540, -20.205),
            (28.540, -20.185),
            (28.520, -20.185),
        ]
    },
    "Nkulumane": {
        "lat": -20.164,
        "lng": 28.516,
        "corners": [
            (28.506, -20.174),
            (28.526, -20.174),
            (28.526, -20.154),
            (28.506, -20.154),
        ]
    },
    "Northern": {
        "lat": -20.122,
        "lng": 28.595,
        "corners": [
            (28.585, -20.132),
            (28.605, -20.132),
            (28.605, -20.112),
            (28.585, -20.112),
        ]
    },
    "Pardonhurst": {
        "lat": -20.132,
        "lng": 28.610,
        "corners": [
            (28.600, -20.142),
            (28.620, -20.142),
            (28.620, -20.122),
            (28.600, -20.122),
        ]
    },
    "Parklands": {
        "lat": -20.140,
        "lng": 28.615,
        "corners": [
            (28.605, -20.150),
            (28.625, -20.150),
            (28.625, -20.130),
            (28.605, -20.130),
        ]
    },
    "Pumula": {
        "lat": -20.185,
        "lng": 28.540,
        "corners": [
            (28.530, -20.195),
            (28.550, -20.195),
            (28.550, -20.175),
            (28.530, -20.175),
        ]
    },
    "Queens Park": {
        "lat": -20.145,
        "lng": 28.605,
        "corners": [
            (28.595, -20.155),
            (28.615, -20.155),
            (28.615, -20.135),
            (28.595, -20.135),
        ]
    },
    "Richmond": {
        "lat": -20.160,
        "lng": 28.605,
        "corners": [
            (28.595, -20.170),
            (28.615, -20.170),
            (28.615, -20.150),
            (28.595, -20.150),
        ]
    },
    "Sizinda": {
        "lat": -20.1729,
        "lng": 28.5433,
        "corners": [
            (28.5333, -20.1829),
            (28.5533, -20.1829),
            (28.5533, -20.1629),
            (28.5333, -20.1629),
        ]
    },
    "Steeldale/Thorngrove": {
        "lat": -20.140,
        "lng": 28.570,
        "corners": [
            (28.560, -20.150),
            (28.580, -20.150),
            (28.580, -20.130),
            (28.560, -20.130),
        ]
    },
    "Tegela": {
        "lat": -20.158,
        "lng": 28.558,
        "corners": [
            (28.548, -20.168),
            (28.568, -20.168),
            (28.568, -20.148),
            (28.548, -20.148),
        ]
    },
    "Trenance": {
        "lat": -20.168,
        "lng": 28.612,
        "corners": [
            (28.602, -20.178),
            (28.622, -20.178),
            (28.622, -20.158),
            (28.602, -20.158),
        ]
    },
}

# Zones mapping
ZONES = [
    {"id": "75c0d949-bd65-49f1-80f6-206909e3dfac", "name": "12th Ave Wholesale Corridor"},
    {"id": "e90cd624-92ba-4659-bb9d-72cdc5efa67a", "name": "Ascot"},
    {"id": "3f3d9547-ca11-48c7-8a0f-39f95af522a0", "name": "Belmont Industrial"},
    {"id": "77ac5ffc-3a3b-4868-a1b1-0ab84473870c", "name": "CBD / Sauce Town"},
    {"id": "8343596a-2a7c-4e85-99f1-b02c7715d168", "name": "CBD Core"},
    {"id": "0a54a8b4-c84e-4cba-8d7f-b3e76ca44e42", "name": "Cowdray Park"},
    {"id": "37e3ea33-cb08-403d-b50e-8e1ee888e165", "name": "Donnington Industrial"},
    {"id": "4057ef95-03b4-47aa-b306-4e320e46091e", "name": "Egodini Terminus"},
    {"id": "3e45e529-6e08-48ab-b080-7b0cdbc531e4", "name": "Entumbane"},
    {"id": "ae552f07-18ad-4111-9bdc-2c62d999d13b", "name": "Hurrisvale"},
    {"id": "18fbe887-2267-4785-901b-54f3ab33bec6", "name": "Kelvin Industrial"},
    {"id": "5c548bd1-1c6a-4af7-9d67-6988cc9b9ce9", "name": "Kenilworth"},
    {"id": "775c4a97-a6fc-499a-a825-1fd3df79dcd4", "name": "Killarney"},
    {"id": "cd046fd6-5eec-4bc8-b718-4a23041e6f0d", "name": "Kumalo"},
    {"id": "7c1c7ed5-034b-4ff2-a4a8-5a78a2556e82", "name": "Luveve"},
    {"id": "c08b97d3-04fb-47a8-b10b-d023023f3ffa", "name": "Magwegwe"},
    {"id": "569c3b92-4287-48d1-9a84-3d3e7d7d63b0", "name": "Mahatshula"},
    {"id": "9c1b99a4-8917-4079-a7e4-61643373bfa3", "name": "Makhandeni"},
    {"id": "ac16b0cf-4f92-4e1b-b855-e258d29cef74", "name": "Makokoba"},
    {"id": "81400bae-e12d-4032-8a22-9f76e76fb5df", "name": "Matshobane"},
    {"id": "7d0cc4e6-0a3a-4065-8cd0-88822d034c18", "name": "Mzilikazi"},
    {"id": "5bdf3e1d-71fc-47d2-9e00-bdffb5693b5d", "name": "Njube"},
    {"id": "746083c9-1246-484c-89b4-f1bcd7f84e74", "name": "Nketa"},
    {"id": "bfe50f4a-f171-4100-ae89-eecbd377172e", "name": "Nkulumane"},
    {"id": "034366f6-a3f0-4271-9f75-510973ddaa2a", "name": "Northern"},
    {"id": "50c796f2-7ff0-4af1-bca7-9fb0ef419476", "name": "Pardonhurst"},
    {"id": "00ee887e-1706-41fe-837d-3359dedf8ff9", "name": "Parklands"},
    {"id": "e07da959-0857-4e59-9244-3a52dba4bc85", "name": "Pumula"},
    {"id": "a4238129-1fd2-4b69-be5e-1bd85ca6d33e", "name": "Queens Park"},
    {"id": "d475bd37-0247-4195-8e8c-27234dd074b8", "name": "Renkini Market"},
    {"id": "8304295f-6381-47bd-9936-75dd6e955162", "name": "Richmond"},
    {"id": "b842d700-1696-4796-8a1c-45e3780f0edf", "name": "Sizinda"},
    {"id": "afae46df-f203-4902-8079-41b890e7bee8", "name": "Steeldale/Thorngrove"},
    {"id": "d2d480a9-2994-4268-8ea7-6387994f0397", "name": "Tegela"},
    {"id": "486aa625-078e-4d14-8668-0553fc2d31a9", "name": "Trenance"},
]


def create_polygon_from_corners(corners: List[Tuple[float, float]]) -> Dict:
    """Create a GeoJSON polygon from corner coordinates."""
    # Close the polygon by adding the first point at the end
    coords = [list(corner) for corner in corners]
    coords.append(coords[0])

    return {
        "type": "Polygon",
        "coordinates": [coords]
    }


def main():
    print("Creating realistic Bulawayo suburb boundaries...")
    print(f"Total zones to process: {len(ZONES)}\n")

    updated_zones = []
    skipped_zones = []
    sql_updates = []

    for i, zone in enumerate(ZONES):
        zone_id = zone["id"]
        zone_name = zone["name"]

        # Skip non-suburb zones
        if zone_name in NON_SUBURB_ZONES:
            print(f"[{i+1}/{len(ZONES)}] {zone_name}: SKIPPED (non-suburb)")
            skipped_zones.append((zone_name, "Non-suburb zone"))
            continue

        if zone_name not in BULAWAYO_SUBURBS:
            print(f"[{i+1}/{len(ZONES)}] {zone_name}: SKIPPED (no boundary data)")
            skipped_zones.append((zone_name, "No boundary data"))
            continue

        print(f"[{i+1}/{len(ZONES)}] {zone_name}...", end=" ", flush=True)

        # Get suburb data
        suburb = BULAWAYO_SUBURBS[zone_name]
        polygon = create_polygon_from_corners(suburb["corners"])

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
