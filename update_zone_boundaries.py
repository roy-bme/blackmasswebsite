#!/usr/bin/env python3
"""
Update Indaba zone boundaries from OpenStreetMap via Nominatim.
"""
import requests
import time
import json
from typing import Optional, Dict, Any

# Nominatim settings
NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "ZimX-Indaba/1.0"
RATE_LIMIT_DELAY = 1.1  # seconds between requests

# Non-suburb zones that should keep placeholders
NON_SUBURB_ZONES = {
    "12th Ave Wholesale Corridor",
    "CBD Core",
    "CBD / Sauce Town",
    "Egodini Terminus",
    "Renkini Market"
}

nominatim_headers = {
    "User-Agent": NOMINATIM_USER_AGENT
}

# Zones from Supabase (already fetched)
ZONES = [
    {"id":"75c0d949-bd65-49f1-80f6-206909e3dfac","name":"12th Ave Wholesale Corridor","centre_lat":"-20.153","centre_lng":"28.573"},
    {"id":"e90cd624-92ba-4659-bb9d-72cdc5efa67a","name":"Ascot","centre_lat":"-20.130","centre_lng":"28.608"},
    {"id":"3f3d9547-ca11-48c7-8a0f-39f95af522a0","name":"Belmont Industrial","centre_lat":"-20.168","centre_lng":"28.570"},
    {"id":"77ac5ffc-3a3b-4868-a1b1-0ab84473870c","name":"CBD / Sauce Town","centre_lat":"-20.1340","centre_lng":"28.5890"},
    {"id":"8343596a-2a7c-4e85-99f1-b02c7715d168","name":"CBD Core","centre_lat":"-20.150","centre_lng":"28.583"},
    {"id":"0a54a8b4-c84e-4cba-8d7f-b3e76ca44e42","name":"Cowdray Park","centre_lat":"-20.200","centre_lng":"28.490"},
    {"id":"37e3ea33-cb08-403d-b50e-8e1ee888e165","name":"Donnington Industrial","centre_lat":"-20.140","centre_lng":"28.550"},
    {"id":"4057ef95-03b4-47aa-b306-4e320e46091e","name":"Egodini Terminus","centre_lat":"-20.153","centre_lng":"28.577"},
    {"id":"3e45e529-6e08-48ab-b080-7b0cdbc531e4","name":"Entumbane","centre_lat":"-20.165","centre_lng":"28.537"},
    {"id":"ae552f07-18ad-4111-9bdc-2c62d999d13b","name":"Hurrisvale","centre_lat":"-20.175","centre_lng":"28.610"},
    {"id":"18fbe887-2267-4785-901b-54f3ab33bec6","name":"Kelvin Industrial","centre_lat":"-20.170","centre_lng":"28.540"},
    {"id":"5c548bd1-1c6a-4af7-9d67-6988cc9b9ce9","name":"Kenilworth","centre_lat":"-20.128","centre_lng":"28.600"},
    {"id":"775c4a97-a6fc-499a-a825-1fd3df79dcd4","name":"Killarney","centre_lat":"-20.120","centre_lng":"28.615"},
    {"id":"cd046fd6-5eec-4bc8-b718-4a23041e6f0d","name":"Kumalo","centre_lat":"-20.160","centre_lng":"28.598"},
    {"id":"7c1c7ed5-034b-4ff2-a4a8-5a78a2556e82","name":"Luveve","centre_lat":"-20.115","centre_lng":"28.520"},
    {"id":"c08b97d3-04fb-47a8-b10b-d023023f3ffa","name":"Magwegwe","centre_lat":"-20.155","centre_lng":"28.535"},
    {"id":"569c3b92-4287-48d1-9a84-3d3e7d7d63b0","name":"Mahatshula","centre_lat":"-20.105","centre_lng":"28.505"},
    {"id":"9c1b99a4-8917-4079-a7e4-61643373bfa3","name":"Makhandeni","centre_lat":"-20.140","centre_lng":"28.530"},
    {"id":"ac16b0cf-4f92-4e1b-b855-e258d29cef74","name":"Makokoba","centre_lat":"-20.148","centre_lng":"28.570"},
    {"id":"81400bae-e12d-4032-8a22-9f76e76fb5df","name":"Matshobane","centre_lat":"-20.152","centre_lng":"28.575"},
    {"id":"7d0cc4e6-0a3a-4065-8cd0-88822d034c18","name":"Mzilikazi","centre_lat":"-20.143","centre_lng":"28.568"},
    {"id":"5bdf3e1d-71fc-47d2-9e00-bdffb5693b5d","name":"Njube","centre_lat":"-20.1321","centre_lng":"28.5287"},
    {"id":"746083c9-1246-484c-89b4-f1bcd7f84e74","name":"Nketa","centre_lat":"-20.195","centre_lng":"28.530"},
    {"id":"bfe50f4a-f171-4100-ae89-eecbd377172e","name":"Nkulumane","centre_lat":"-20.164","centre_lng":"28.516"},
    {"id":"034366f6-a3f0-4271-9f75-510973ddaa2a","name":"Northern","centre_lat":"-20.122","centre_lng":"28.595"},
    {"id":"50c796f2-7ff0-4af1-bca7-9fb0ef419476","name":"Pardonhurst","centre_lat":"-20.132","centre_lng":"28.610"},
    {"id":"00ee887e-1706-41fe-837d-3359dedf8ff9","name":"Parklands","centre_lat":"-20.140","centre_lng":"28.615"},
    {"id":"e07da959-0857-4e59-9244-3a52dba4bc85","name":"Pumula","centre_lat":"-20.185","centre_lng":"28.540"},
    {"id":"a4238129-1fd2-4b69-be5e-1bd85ca6d33e","name":"Queens Park","centre_lat":"-20.145","centre_lng":"28.605"},
    {"id":"d475bd37-0247-4195-8e8c-27234dd074b8","name":"Renkini Market","centre_lat":"-20.142","centre_lng":"28.577"},
    {"id":"8304295f-6381-47bd-9936-75dd6e955162","name":"Richmond","centre_lat":"-20.160","centre_lng":"28.605"},
    {"id":"b842d700-1696-4796-8a1c-45e3780f0edf","name":"Sizinda","centre_lat":"-20.1729","centre_lng":"28.5433"},
    {"id":"afae46df-f203-4902-8079-41b890e7bee8","name":"Steeldale/Thorngrove","centre_lat":"-20.140","centre_lng":"28.570"},
    {"id":"d2d480a9-2994-4268-8ea7-6387994f0397","name":"Tegela","centre_lat":"-20.158","centre_lng":"28.558"},
    {"id":"486aa625-078e-4d14-8668-0553fc2d31a9","name":"Trenance","centre_lat":"-20.168","centre_lng":"28.612"},
]


def query_nominatim(zone_name: str) -> Optional[Dict[str, Any]]:
    """Query Nominatim for zone boundary."""
    params = {
        "q": f"{zone_name},Bulawayo,Zimbabwe",
        "format": "jsonv2",
        "polygon_geojson": "1",
        "limit": "1"
    }

    response = requests.get(
        NOMINATIM_BASE,
        headers=nominatim_headers,
        params=params
    )
    response.raise_for_status()

    results = response.json()
    if results:
        return results[0]
    return None


def main():
    print("Processing zones...")
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

        print(f"[{i+1}/{len(ZONES)}] {zone_name}...", end=" ", flush=True)

        # Query Nominatim
        try:
            result = query_nominatim(zone_name)
        except Exception as e:
            print(f"ERROR: {e}")
            skipped_zones.append((zone_name, f"Nominatim error: {e}"))
            time.sleep(RATE_LIMIT_DELAY)
            continue

        # Check if we got a valid polygon
        if not result or "geojson" not in result:
            print("NO POLYGON")
            skipped_zones.append((zone_name, "No polygon in Nominatim result"))
            time.sleep(RATE_LIMIT_DELAY)
            continue

        geojson = result.get("geojson")
        geom_type = geojson.get("type")

        if geom_type not in ["Polygon", "MultiPolygon"]:
            print(f"SKIPPED ({geom_type})")
            skipped_zones.append((zone_name, f"Geometry type: {geom_type}"))
            time.sleep(RATE_LIMIT_DELAY)
            continue

        # Extract coordinates
        lat = result.get("lat", zone["centre_lat"])
        lng = result.get("lon", zone["centre_lng"])

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            lat = float(zone["centre_lat"])
            lng = float(zone["centre_lng"])

        # Build SQL update
        geojson_str = json.dumps(geojson).replace("'", "''")
        sql = f"UPDATE public.zones SET boundary_geojson = '{geojson_str}', centre_lat = {lat}, centre_lng = {lng} WHERE id = '{zone_id}';"
        sql_updates.append(sql)

        updated_zones.append(zone_name)
        print("UPDATED")

        # Respect rate limit
        time.sleep(RATE_LIMIT_DELAY)

    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\nUpdated: {len(updated_zones)}")
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
