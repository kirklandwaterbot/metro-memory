#!/usr/bin/env python3
"""
Draws lines as the tracks their own OpenStreetMap route relations use.

A service's route relations (usually one per direction) list exactly the
tracks it runs on, so drawing their member ways gives every track the service
uses (two or more where it has two or more) and none of the neighbouring
lines' tracks. scripts/routes/osm-tracks.js instead takes every track within a
buffer of the route, which picks up other lines' tracks where they run close
by (e.g. the 7 and the N/W at Queensboro Plaza).

Reads data-sources/<city>/osm-relation-tracks.json:

  { "lines": { "NewYorkSubwayN": [9699161, 9712347], ... }, "trim": false }

(relation ids; pick the everyday variants, not late-night or rush-hour ones;
scripts/routes/osm-relation-match.py can find them for a new city). With
"trim": true each relation is cut to the stretch between the first and last
of the line's stations it serves. With "keepCentreline": "stations" the saved
centreline is only kept where a station needs it (for coarse old geometry
that doesn't follow the track, e.g. data imported from a journey planner), and
with "none" never (then run scripts/routes/align-stations.py to move station
dots that sat off the track onto it). With "connectStations": true a station
more than CONNECT_FROM_M from the drawn line is joined to it along the
shortest stretch of any OSM track (an extension the relations don't have yet).
"extraWays": {"<line>": [way id, {"id": way id, "nodes": [first, last]}, ...]}
adds OSM ways the relations don't list yet (e.g. track under construction),
optionally only nodes first..last of a way (to stop at the terminus).
Reads the files written by scripts/routes/osm-pbf-extract.py.

Where the game's line runs somewhere its relations don't (e.g. a line still
under construction), the line's saved centreline from
data-sources/<city>/track-centrelines.json is kept for that stretch, but only
where no other OSM track runs there or a station needs it, so an old or wrong
routing is not drawn. A terminus station that sits just past the end of the
mapped track gets a short link drawn from the centreline.

  python3 scripts/routes/osm-relation-tracks.py nyc .tmp/osm/nyc           # write
  python3 scripts/routes/osm-relation-tracks.py nyc .tmp/osm/nyc --dry-run
  python3 scripts/routes/osm-relation-tracks.py nyc .tmp/osm/nyc --lines=NewYorkSubwayN,NewYorkSubwayQ

Then run `node scripts/routes/fill-gaps.js --city=<city> --check`.
Geometry © OpenStreetMap contributors (ODbL).
"""
import json
import math
import os
import re
import sys
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
COVER_M = 40       # a centreline point is covered if relation track is this close
OTHER_M = 25       # ...and runs along other OSM track if that is this close
STATION_M = 120    # a station is on its line within this distance
LINK_M = 260       # longest link drawn to a terminus just past the track
MIN_KEEP_M = 80
CONNECT_FROM_M = 250   # with "connectStations": true, stations this far off get joined
CLIP_M = 60000    # "keepCentreline": "stations" keeps old geometry this close to such a station
TRIM_M = 400      # with "trim": true, a way serves a station within this distance


def load_city_dir(slug):
    text = open(os.path.join(ROOT, 'src', 'lib', 'cityPathMap.ts'), encoding='utf-8').read()
    m = re.search(r"['\"]%s['\"]\s*:\s*['\"]([^'\"]+)['\"]" % re.escape(slug), text)
    if not m:
        sys.exit(f'unknown city {slug}')
    base = os.path.join(ROOT, 'src', 'app', '(game)', m.group(1), 'data')
    for d in (base, os.path.join(base, 'full')):
        if os.path.exists(os.path.join(d, 'routes.json')):
            return d
    sys.exit(f'no routes.json under {base}')


def line_key(props):
    """Routes name their line in "line" (most cities) or "id" (Paris)."""
    return props.get('line', props.get('id'))


def line_meta(data_dir):
    """name/color per line, from data/lines.json or the LINES table in config.ts."""
    meta = {}
    lp = os.path.join(data_dir, 'lines.json')
    if os.path.exists(lp):
        for k, v in json.load(open(lp, encoding='utf-8')).items():
            meta[k] = {'name': v.get('name'), 'color': v.get('color')}
    cfg = os.path.join(data_dir.split(os.sep + 'data')[0], 'config.ts')
    if os.path.exists(cfg):
        text = open(cfg, encoding='utf-8').read()
        for m in re.finditer(r"""['"]?([\w -]+?)['"]?\s*:\s*\{[^{}]*?\bname:\s*(['"])(.*?)\2[^{}]*?\bcolor:\s*(['"])(#[0-9A-Fa-f]{3,8})\4""", text, re.S):
            meta.setdefault(m.group(1).strip(), {'name': m.group(3), 'color': m.group(5)})
    return meta


class Geo:
    def __init__(self, lat0):
        self.k = math.cos(math.radians(lat0))

    def xy(self, p):
        return (p[0] * self.k * 111320, p[1] * 110540)

    def dist(self, a, b):
        return math.dist(self.xy(a), self.xy(b))

    def seg(self, p, a, b):
        (px, py), (ax, ay), (bx, by) = self.xy(p), self.xy(a), self.xy(b)
        dx, dy = bx - ax, by - ay
        l2 = dx * dx + dy * dy
        t = 0 if l2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / l2))
        return math.hypot(ax + t * dx - px, ay + t * dy - py)


class Index:
    """Segments bucketed on a grid, for nearest-distance queries."""

    def __init__(self, geo, strings, cell=100.0):
        self.geo, self.cell, self.grid = geo, cell, {}
        for s in strings:
            for a, b in zip(s, s[1:]):
                (x1, y1), (x2, y2) = geo.xy(a), geo.xy(b)
                for gx in range(int(min(x1, x2) // cell), int(max(x1, x2) // cell) + 1):
                    for gy in range(int(min(y1, y2) // cell), int(max(y1, y2) // cell) + 1):
                        self.grid.setdefault((gx, gy), []).append((a, b))

    def dist(self, p, r):
        x, y = self.geo.xy(p)
        best = math.inf
        for gx in range(int((x - r) // self.cell), int((x + r) // self.cell) + 1):
            for gy in range(int((y - r) // self.cell), int((y + r) // self.cell) + 1):
                for a, b in self.grid.get((gx, gy), ()):
                    best = min(best, self.geo.seg(p, a, b))
        return best


def densify(geo, s, step=15):
    out = [s[0]]
    for a, b in zip(s, s[1:]):
        n = int(geo.dist(a, b) // step)
        for i in range(1, n + 1):
            t = i / (n + 1)
            out.append([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
        out.append(b)
    return out


def connector(geo, all_ways_idx, graph, st, drawn_idx, max_m=15000, near_m=400):
    """Shortest path along any OSM track from a station to the drawn line."""
    import heapq
    nodes, adj = graph
    near_st = [k for k, p in nodes.items() if geo.dist(p, st) <= near_m]
    if not near_st:
        return None
    best = {k: geo.dist(nodes[k], st) for k in near_st}
    prev = {}
    h = [(d, k) for k, d in best.items()]
    heapq.heapify(h)
    while h:
        d, u = heapq.heappop(h)
        if d > best.get(u, math.inf) or d > max_m:
            continue
        if drawn_idx.dist(nodes[u], 15) <= 15:
            path = [u]
            while path[-1] in prev:
                path.append(prev[path[-1]])
            return [nodes[k] for k in path]
        for v, w in adj.get(u, ()):
            nd = d + w
            if nd < best.get(v, math.inf):
                best[v] = nd
                prev[v] = u
                heapq.heappush(h, (nd, v))
    return None


def build_graph(geo, ways):
    nodes, adj = {}, {}
    for coords in ways.values():
        prev = None
        for p in coords:
            k = (round(p[0], 6), round(p[1], 6))
            nodes[k] = [k[0], k[1]]
            if prev is not None and prev != k:
                w = geo.dist(nodes[prev], nodes[k])
                adj.setdefault(prev, []).append((k, w))
                adj.setdefault(k, []).append((prev, w))
            prev = k
    return nodes, adj


def length(geo, s):
    return sum(geo.dist(a, b) for a, b in zip(s, s[1:]))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = dict((a[2:].split('=', 1) + [True])[:2] for a in sys.argv[1:] if a.startswith('--'))
    if len(args) != 2:
        sys.exit(__doc__)
    slug, prefix = args
    config = json.load(open(os.path.join(ROOT, 'data-sources', slug, 'osm-relation-tracks.json')))
    lines = config['lines']
    if 'lines' in flags:
        wanted = set(flags['lines'].split(','))
        lines = {k: v for k, v in lines.items() if k in wanted}
    data_dir = load_city_dir(slug)
    routes_path = os.path.join(data_dir, 'routes.json')
    routes = json.load(open(routes_path, encoding='utf-8'))
    feats = json.load(open(os.path.join(data_dir, 'features.json'), encoding='utf-8'))['features']
    centre_path = os.path.join(ROOT, 'data-sources', slug, 'track-centrelines.json')
    centre = json.load(open(centre_path)) if os.path.exists(centre_path) else {}

    ways = {e['id']: [[round(g['lon'], 6), round(g['lat'], 6)] for g in e['geometry']]
            for e in json.load(open(prefix + '-ways.json'))['elements']}
    rels = {r['id']: r for r in json.load(open(prefix + '-relations.json'))}
    lat0 = sum(f['geometry']['coordinates'][1] for f in feats) / len(feats)
    geo = Geo(lat0)
    any_track = Index(geo, list(ways.values()))
    _graph = []

    def graph():
        if not _graph:
            _graph.append(build_graph(geo, ways))
        return _graph[0]

    report, drawn = [], {}
    for line, ids in lines.items():
        missing = [i for i in ids if i not in rels]
        stations = [f for f in feats if f['properties']['line'] == line]
        st_idx = Index(geo, [[f['geometry']['coordinates'], f['geometry']['coordinates']] for f in stations])
        member_ways = []
        for rid in ids:
            wl = [m['ref'] for m in rels.get(rid, {}).get('members', []) if m['type'] == 'w' and m['ref'] in ways]
            if config.get('trim') and wl:
                # keep the relation's track between the first and last of this
                # line's stations it passes (a relation can run on past the
                # game's terminus)
                near = [i for i, w in enumerate(wl)
                        if any(st_idx.dist(p, TRIM_M) <= TRIM_M for p in densify(geo, ways[w], 100))]
                wl = wl[min(near):max(near) + 1] if near else []
            for w in wl:
                if w not in member_ways:
                    member_ways.append(w)
        track = [ways[w] for w in member_ways]
        n_extra = 0
        for spec in config.get('extraWays', {}).get(line, []):
            wid = spec['id'] if isinstance(spec, dict) else spec
            if wid not in ways:
                missing.append(f'way {wid}')
                continue
            coords = ways[wid]
            if isinstance(spec, dict) and 'nodes' in spec:
                a, b = spec['nodes']
                coords = coords[a:b + 1]
            if len(coords) >= 2:
                track.append(coords)
                n_extra += 1
        idx = Index(geo, track)
        conns = 0
        if config.get('connectStations'):
            # a station the line's relations stop short of (an extension not yet
            # in them, a branch shuttle) is joined to the line along OSM track
            for f in stations:
                st = f['geometry']['coordinates']
                if idx.dist(st, CONNECT_FROM_M) <= CONNECT_FROM_M:
                    continue
                path = connector(geo, None, graph(), st, idx)
                if path and len(path) >= 2:
                    track.append(path)
                    idx = Index(geo, track)
                    conns += 1
        far = CONNECT_FROM_M if config.get('keepCentreline') == 'stations' else STATION_M
        uncovered = [f['geometry']['coordinates'] for f in stations
                     if idx.dist(f['geometry']['coordinates'], far) > far]

        # stretches of the saved centreline the relations don't cover
        extra = []
        for s in centre.get(line, []):
            cur = []
            for p in densify(geo, s):
                if idx.dist(p, COVER_M) > COVER_M:
                    cur.append(p)
                else:
                    if len(cur) >= 2:
                        extra.append(cur)
                    cur = []
            if len(cur) >= 2:
                extra.append(cur)

        def keep(e):
            if length(geo, e) < MIN_KEEP_M or config.get('keepCentreline') == 'none':
                return False
            if any(min(geo.dist(u, p) for p in e) <= STATION_M for u in uncovered):
                return True
            if config.get('keepCentreline') == 'stations':
                return False
            on_other = sum(1 for p in e if any_track.dist(p, OTHER_M) <= OTHER_M)
            return on_other < 0.5 * len(e)

        extra = [e for e in extra if keep(e)]
        if config.get('keepCentreline') == 'stations':
            # only the bit of old geometry around the station that needs it
            clipped = []
            for e in extra:
                cur = []
                for p in e:
                    if any(geo.dist(p, u) <= CLIP_M for u in uncovered):
                        cur.append(p)
                    elif len(cur) >= 2:
                        clipped.append(cur); cur = []
                    else:
                        cur = []
                if len(cur) >= 2:
                    clipped.append(cur)
            extra = clipped

        # a terminus just past the end of the mapped track gets a short link
        links = []
        all_idx = Index(geo, track + extra)
        for f in stations if config.get('keepCentreline') != 'none' else []:
            st = f['geometry']['coordinates']
            d = all_idx.dist(st, LINK_M)
            if STATION_M < d <= LINK_M:
                pts = [p for s in track + extra for p in s]
                end = min(pts, key=lambda p: geo.dist(p, st))
                via = [p for s in centre.get(line, []) for p in s
                       if geo.dist(p, st) < geo.dist(end, st) and geo.dist(p, end) < geo.dist(end, st)]
                via.sort(key=lambda p: geo.dist(p, end))
                links.append([end] + via + [st])
        strings = track + extra + links
        final = Index(geo, strings)
        off = [f['properties']['name'] for f in stations
               if final.dist(f['geometry']['coordinates'], STATION_M) > STATION_M]
        km = sum(length(geo, e) for e in extra) / 1000
        report.append(
            f"{'✅' if not off and not missing and track else '⚠️'} {line}: {len(member_ways)} OSM ways"
            + (f', {n_extra} extra way(s)' if n_extra else '')
            + (f', {km:.1f} km kept from the centreline' if km >= 0.05 else '')
            + (f', {len(links)} terminus link(s)' if links else '')
            + (f', {conns} station(s) joined along OSM track' if conns else '')
            + (f', relations not in the extract: {missing}' if missing else '')
            + (f', stations off the line: {off}' if off else '')
        )
        if track:
            drawn[line] = [[[round(x, 6), round(y, 6)] for x, y in s] for s in strings]

    print('\n'.join(report))
    if flags.get('dry-run'):
        return
    out, done = [], set()
    for f in routes['features']:
        line = line_key(f['properties'])
        if line not in drawn:
            out.append(f)
            continue
        if line in done or f['properties'].get('future'):
            if f['properties'].get('future'):
                out.append(f)
            continue
        done.add(line)
        props = {k: v for k, v in f['properties'].items() if k not in ('auto_filled', 'osm_tracks', 'osm_route')}
        props['osm_tracks'] = {
            'source': '© OpenStreetMap contributors (ODbL), route relations',
            'built': date.today().isoformat(),
        }
        out.append({'type': 'Feature', 'geometry': {'type': 'MultiLineString', 'coordinates': drawn[line]},
                    'properties': props})
    # lines that had no drawing at all get one
    key = 'id' if routes['features'] and 'line' not in routes['features'][0]['properties'] and 'id' in routes['features'][0]['properties'] else 'line'
    meta = line_meta(data_dir)
    for line in drawn:
        if line not in done:
            props = {key: line, 'name': (meta.get(line) or {}).get('name') or line,
                     'color': (meta.get(line) or {}).get('color') or '#888888',
                     'osm_tracks': {'source': '© OpenStreetMap contributors (ODbL), route relations',
                                    'built': date.today().isoformat()}}
            out.append({'type': 'Feature', 'geometry': {'type': 'MultiLineString', 'coordinates': drawn[line]},
                        'properties': props})
    routes['features'] = out
    raw = open(routes_path, encoding='utf-8').read()
    pretty = raw.lstrip().startswith('{\n') or raw.startswith('{\n')
    text = json.dumps(routes, ensure_ascii=False, indent=2 if pretty else None,
                      separators=None if pretty else (',', ':'))
    with open(routes_path, 'w', encoding='utf-8') as f:
        f.write(text + ('\n' if raw.endswith('\n') else ''))
    print(f'wrote {len(drawn)} lines to {os.path.relpath(routes_path, ROOT)}')


if __name__ == '__main__':
    main()
