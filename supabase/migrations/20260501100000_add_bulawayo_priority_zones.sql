-- Add Bulawayo priority ground-ops zones.
--
-- Inserts four new zones used by ground-ops teams. Existing zones with
-- matching names (Nkulumane, Cowdray Park, Pumula) are already present and
-- are intentionally left untouched. Each new zone stores a GeoJSON
-- bounding-box polygon in boundary_geojson so future map renderers can pull
-- shapes directly from the database.
INSERT INTO public.zones (name, type, centre_lat, centre_lng, boundary_geojson, status)
VALUES
  (
    'CBD / Sauce Town',
    'ground_ops_priority_1',
    -20.1340,
    28.5890,
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(28.5750::numeric, -20.1570::numeric),
          jsonb_build_array(28.6000::numeric, -20.1570::numeric),
          jsonb_build_array(28.6000::numeric, -20.1100::numeric),
          jsonb_build_array(28.5750::numeric, -20.1100::numeric),
          jsonb_build_array(28.5750::numeric, -20.1570::numeric)
        )
      )
    ),
    'active'
  ),
  (
    'Sizinda',
    'ground_ops_secondary',
    -20.1729,
    28.5433,
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(28.5280::numeric, -20.1850::numeric),
          jsonb_build_array(28.5580::numeric, -20.1850::numeric),
          jsonb_build_array(28.5580::numeric, -20.1600::numeric),
          jsonb_build_array(28.5280::numeric, -20.1600::numeric),
          jsonb_build_array(28.5280::numeric, -20.1850::numeric)
        )
      )
    ),
    'unmapped'
  ),
  (
    'Njube',
    'ground_ops_secondary',
    -20.1321,
    28.5287,
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(28.5100::numeric, -20.1450::numeric),
          jsonb_build_array(28.5450::numeric, -20.1450::numeric),
          jsonb_build_array(28.5450::numeric, -20.1200::numeric),
          jsonb_build_array(28.5100::numeric, -20.1200::numeric),
          jsonb_build_array(28.5100::numeric, -20.1450::numeric)
        )
      )
    ),
    'unmapped'
  ),
  (
    'Nketa',
    'ground_ops_secondary',
    -20.2009,
    28.5314,
    jsonb_build_object(
      'type', 'Polygon',
      'coordinates', jsonb_build_array(
        jsonb_build_array(
          jsonb_build_array(28.5150::numeric, -20.2150::numeric),
          jsonb_build_array(28.5500::numeric, -20.2150::numeric),
          jsonb_build_array(28.5500::numeric, -20.1900::numeric),
          jsonb_build_array(28.5150::numeric, -20.1900::numeric),
          jsonb_build_array(28.5150::numeric, -20.2150::numeric)
        )
      )
    ),
    'unmapped'
  )
ON CONFLICT (name) DO NOTHING;
