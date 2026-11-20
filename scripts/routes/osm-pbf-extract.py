#!/usr/bin/env python3
"""
Pulls rail track and rail route relations out of an OpenStreetMap .osm.pbf
extract, for scripts/routes/osm-relation-tracks.py. Use this when the public
Overpass servers are too busy: download an extract that covers the city (e.g.
https://download.bbbike.org/osm/bbbike/NewYork/NewYork.osm.pbf, or a
Geofabrik region) and run

  pip install osmium
  python3 scripts/routes/osm-pbf-extract.py NewYork.osm.pbf .tmp/osm/nyc

which writes .tmp/osm/nyc-ways.json (rail ways with geometry, in Overpass
`out tags geom` form, so scripts/routes/osm-tracks.js --overpass-file can read
it too) and .tmp/osm/nyc-relations.json (route relations with their members).

Data © OpenStreetMap contributors (ODbL).
"""
import json
import sys

import osmium

RAILWAYS = {'subway', 'rail', 'light_rail', 'tram', 'monorail', 'narrow_gauge', 'funicular', 'construction'}
ROUTES = {'subway', 'train', 'light_rail', 'railway', 'tram', 'monorail', 'funicular'}


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, prefix = sys.argv[1], sys.argv[2]
    ways, rels = [], []

    class Handler(osmium.SimpleHandler):
        def way(self, w):
            t = w.tags
            if t.get('railway') not in RAILWAYS or t.get('service') in ('yard', 'spur', 'siding'):
                return
            try:
                geom = [{'lat': n.lat, 'lon': n.lon} for n in w.nodes]
            except osmium.InvalidLocationError:
                return
            ways.append({'type': 'way', 'id': w.id, 'tags': {k.k: k.v for k in t}, 'geometry': geom})

        def relation(self, r):
            t = r.tags
            if t.get('type') != 'route' or t.get('route') not in ROUTES:
                return
            rels.append({
                'id': r.id,
                'tags': {k.k: k.v for k in t},
                'members': [{'type': m.type, 'ref': m.ref, 'role': m.role} for m in r.members],
            })

    Handler().apply_file(src, locations=True)
    with open(prefix + '-ways.json', 'w') as f:
        json.dump({'elements': ways}, f)
    with open(prefix + '-relations.json', 'w') as f:
        json.dump(rels, f)
    print(f'{len(ways)} rail ways -> {prefix}-ways.json')
    print(f'{len(rels)} route relations -> {prefix}-relations.json')


if __name__ == '__main__':
    main()
