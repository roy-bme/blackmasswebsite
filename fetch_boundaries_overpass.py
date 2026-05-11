#!/usr/bin/env python3
"""
Fetch Bulawayo suburb boundaries using Overpass API.
"""
import requests
import time
import json
from typing import Optional, Dict, Any

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
RATE_LIMIT_DELAY = 1.1

# Non-suburb zones that should keep placeholders
NON_SUBURB_ZONES = {
    "12th Ave Wholesale Corridor",
    "CBD Core",
    "CBD / Sauce Town",
    "Egodini Terminus",
    "Renkini Market"
}

# Map zone names to Overpass queries
# Using admin_level and name tags to find suburb boundaries
ZONES = [
    {"id":"e90cd624-92ba-4659-bb9d-72cdc5efa67a","name":"Ascot"},
    {"id":"3f3d9547-ca11-48c7-8a0f-39f95af522a0","name":"Belmont Industrial"},
    {"id":"0a54a8b4-c84e-4cba-8d7f-b3e76ca44e42","name":"Cowdray Park"},
    {"id":"37e3ea33-cb08-403d-b50e-8e1ee888e165","name":"Donnington Industrial"},
    {"id":"3e45e529-6e08-48ab-b080-7b0cdbc531e4","name":"Entumbane"},
    {"id":"ae552f07-18ad-4111-9bdc-2c62d999d13b","name":"Hurrisvale"},
    {"id":"18fbe887-2267-4785-901b-54f3ab33bec6","name":"Kelvin Industrial"},
    {"id":"5c548bd1-1c6a-4af7-9d67-6988cc9b9ce9","name":"Kenilworth"},
    {"id":"775c4a97-a6fc-499a-a825-1fd3df79dcd4","name":"Killarney"},
    {"id":"cd046fd6-5eec-4bc8-b718-4a23041e6f0d","name":"Kumalo"},
    {"id":"7c1c7ed5-034b-4ff2-a4a8-5a78a2556e82","name":"Luveve"},
    {"id":"c08b97d3-04fb-47a8-b10b-d023023f3ffa","name":"Magwegwe"},
    {"id":"569c3b92-4287-48d1-9a84-3d3e7d7d63b0","name":"Mahatshula"},
    {"id":"9c1b99a4-8917-4079-a7e4-61643373bfa3","name":"Makhandeni"},
    {"id":"ac16b0cf-4f92-4e1b-b855-e258d29cef74","name":"Makokoba"},
    {"id":"81400bae-e12d-4032-8a22-9f76e76fb5df","name":"Matshobane"},
    {"id":"7d0cc4e6-0a3a-4065-8cd0-88822d034c18","name":"Mzilikazi"},
    {"id":"746083c9-1246-484c-89b4-f1bcd7f84e74","name":"Nketa"},
    {"id":"bfe50f4a-f171-4100-ae89-eecbd377172e","name":"Nkulumane"},
    {"id":"034366f6-a3f0-4271-9f75-510973ddaa2a","name":"Northern"},
    {"id":"50c796f2-7ff0-4af1-bca7-9fb0ef419476","name":"Pardonhurst"},
    {"id":"00ee887e-1706-41fe-837d-3359dedf8ff9","name":"Parklands"},
    {"id":"e07da959-0857-4e59-9244-3a52dba4bc85","name":"Pumula"},
    {"id":"a4238129-1fd2-4b69-be5e-1bd85ca6d33e","name":"Queens Park"},
    {"id":"8304295f-6381-47bd-9936-75dd6e955162","name":"Richmond"},
    {"id":"b842d700-1696-4796-8a1c-45e3780f0edf","name":"Sizinda"},
    {"id":"afae46df-f203-4902-8079-41b890e7bee8","name":"Steeldale/Thorngrove"},
    {"id":"d2d480a9-2994-4268-8ea7-6387994f0397","name":"Tegela"},
    {"id":"486aa625-078e-4d14-8668-0553fc2d31a9","name":"Trenance"},
]


def query_overpass(zone_name: str) -> Optional[Dict[str, Any]]:
    """
    Query Overpass API for zone boundary.
    Try to find administrative areas or suburbs with matching names.
    """
    # Overpass QL query to find administrative boundaries
    query = f"""[bbox:-20.25,28.4,-20.05,28.7];
(
  relation["name"="{zone_name}"]["admin_level"~"8|9|10"];
  relation["name"="{zone_name}"]["boundary"="administrative"];
);
out body geom;
"""

    try:
        response = requests.post(
            OVERPASS_URL,
            data=query,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"ERROR: {e}")
        return None


def main():
    print("Testing Overpass API access for Bulawayo suburb boundaries...")

    # Test with first zone
    test_zone = ZONES[0]
    print(f"\nTesting with {test_zone['name']}...")

    result = query_overpass(test_zone['name'])
    if result:
        print(f"Response keys: {result.keys()}")
        if 'elements' in result:
            print(f"Found {len(result['elements'])} elements")
            if result['elements']:
                print(f"First element: {json.dumps(result['elements'][0], indent=2)[:500]}")
    else:
        print("No response")


if __name__ == "__main__":
    main()
