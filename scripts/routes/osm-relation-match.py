#!/usr/bin/env python3
"""
Finds the OpenStreetMap route relations each of a city's lines runs on, and
writes them to data-sources/<city>/osm-relation-tracks.json for
scripts/routes/osm-relation-tracks.py.

For every game line it scores the extract's route relations (subway, light
rail, train, tram, monorail, funicular) by how many of the line's stations
they pass within NEAR_M, preferring relations whose ref or name matches the
line's name, and picks the fewest that serve all of them. Relations of the
same service in the other direction are added too, so both tracks are drawn.
The lines' current routes are saved as centrelines (if none are saved yet),
for stretches no relation covers.

  python3 scripts/routes/osm-relation-match.py seoul .tmp/osm/seoul
  python3 scripts/routes/osm-relation-match.py seoul .tmp/osm/seoul --ref=SeoulSubway1Hoseon:1,1호선

--ref gives extra names to match a line's relations by (comma separated).
Check the report: a line marked ⚠️ matched less than all of its stations.
"""
import json
import math
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module

tracks = import_module('osm-relation-tracks')

ROUTES = {'subway', 'light_rail', 'train', 'tram', 'monorail', 'funicular', 'railway'}
NEAR_M = 150
NEAR_REF_M = 400   # a relation of the line's own name may pass a station's dot further off
             # (legacy data often puts it at another line's platform)
GOOD = 0.95
MIN_COVER = 0.8
MIN_COVER_REF = 0.5   # the line's own relations, cut off by the extract's edge


def norm(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[\W_]+', '', s.lower())


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    flags = {}
    extra_refs = {}
    for a in sys.argv[1:]:
        if a.startswith('--ref='):
            line, refs = a[6:].split(':', 1)
            extra_refs[line] = refs.split(',')
        elif a.startswith('--'):
            k, _, v = a[2:].partition('=')
            flags[k] = v or True
    slug, prefix = args
    data_dir = tracks.load_city_dir(slug)
    routes = json.load(open(os.path.join(data_dir, 'routes.json'), encoding='utf-8'))
    feats = json.load(open(os.path.join(data_dir, 'features.json'), encoding='utf-8'))['features']
    names = {k: v['name'] for k, v in tracks.line_meta(data_dir).items() if v.get('name')}
    for f in routes['features']:
        line = tracks.line_key(f['properties'])
        if f['properties'].get('name'):
            names.setdefault(line, f['properties'].get('name'))
    stations = {}
    for f in feats:
        stations.setdefault(f['properties']['line'], []).append(f['geometry']['coordinates'])
    lat0 = sum(p[1] for v in stations.values() for p in v) / sum(len(v) for v in stations.values())
    geo = tracks.Geo(lat0)

    ways = {e['id']: [[g['lon'], g['lat']] for g in e['geometry']]
            for e in json.load(open(prefix + '-ways.json'))['elements']}
    allpts = [p for v in stations.values() for p in v]
    minx, maxx = min(p[0] for p in allpts) - 0.1, max(p[0] for p in allpts) + 0.1
    miny, maxy = min(p[1] for p in allpts) - 0.1, max(p[1] for p in allpts) + 0.1

    rels = []
    for r in json.load(open(prefix + '-relations.json')):
        if r['tags'].get('route') not in ROUTES:
            continue
        wl = [m['ref'] for m in r['members'] if m['type'] == 'w' and m['ref'] in ways]
        if not wl:
            continue
        inside = any(minx <= p[0] <= maxx and miny <= p[1] <= maxy for w in wl[:: max(1, len(wl) // 8)] for p in ways[w][:1])
        if inside:
            r['ways'] = wl
            r['index'] = tracks.Index(geo, [ways[w] for w in wl])
            r['km'] = sum(tracks.length(geo, ways[w]) for w in wl) / 1000
            rels.append(r)
    print(f'{len(rels)} candidate relations')

    out = {'note': 'Matched by scripts/routes/osm-relation-match.py; check and edit by hand.', 'trim': True, 'keepCentreline': 'none', 'connectStations': True, 'lines': {}}
    report = []
    for line, pts in stations.items():
        if line not in names:
            continue
        keys = {norm(names[line])} | {norm(k) for k in extra_refs.get(line, [])}
        keys.discard('')
        scored = []
        for r in rels:
            t = r['tags']
            labels = {norm(t.get(k)) for k in ('ref', 'name', 'name:en', 'official_name', 'ref:en') if t.get(k)}
            refmatch = bool(keys & labels) or any(
                len(k) >= 3 and any(k in l for l in labels) for k in keys
            )
            r_m = NEAR_REF_M if refmatch else NEAR_M
            cov = {i for i, p in enumerate(pts) if r['index'].dist(p, r_m) <= r_m}
            if len(cov) < 2:
                continue
            scored.append({'r': r, 'ref': refmatch, 'cov': cov})
        chosen, covered = [], set()
        # a line whose own relations can be told by ref/name only uses those,
        # so a KTX or another line sharing its track is never picked
        pool = [s for s in scored if s['ref']] or scored[:]
        while pool and len(covered) < len(pts):
            # fewest relations: biggest gain first, ref matches and shorter relations break ties
            best = max(pool, key=lambda s: (len(s['cov'] - covered) * (1.6 if s['ref'] else 1), -s['r']['km']))
            gain = len(best['cov'] - covered)
            if gain < (1 if best['ref'] else 2):
                break
            chosen.append(best)
            covered |= best['cov']
            pool.remove(best)
        if len(covered) < GOOD * len(pts) and chosen and all(c['ref'] for c in chosen):
            # the rest of the line (a branch its own relations no longer run
            # to) from whatever else runs there, if it serves several stations
            rest = [s for s in scored if not s['ref']]
            while rest and len(covered) < len(pts):
                best = max(rest, key=lambda s: (len(s['cov'] - covered), -s['r']['km']))
                if len(best['cov'] - covered) < 3:
                    break
                chosen.append(best)
                covered |= best['cov']
                rest.remove(best)
        # the same service the other way: same ref/name family, nearly the same stations
        extra = []
        for c in chosen:
            for s in scored:
                if s in chosen or s in extra:
                    continue
                same = (s['r']['tags'].get('ref') == c['r']['tags'].get('ref')) and len(s['cov'] & c['cov']) >= 0.85 * len(c['cov'])
                if same and len(s['cov']) <= 1.2 * len(c['cov']) + 2:
                    extra.append(s)
        cover = len(covered) / len(pts)
        # a poor match is more likely a different line (a monorail for a cable
        # car, say) than this one: leave the line's drawing as it is
        ids = [s['r']['id'] for s in chosen + extra] if cover >= (MIN_COVER_REF if chosen and chosen[0]['ref'] else MIN_COVER) else []
        out['lines'][line] = ids
        report.append(
            f"{'✅' if cover >= GOOD else '⚠️'} {line} [{names[line]}] {cover:.0%} of {len(pts)} stations"
            + (' — not matched, drawing left as it is' if not ids else '') + ' <- '
            + '; '.join(f"{s['r']['tags'].get('ref', '')} {s['r']['tags'].get('name', '')}"[:60] for s in chosen)
            + (f' (+{len(extra)} reverse)' if extra else '')
        )
    print('\n'.join(report))
    if flags.get('dry-run'):
        return
    ddir = os.path.join(tracks.ROOT, 'data-sources', slug)
    os.makedirs(ddir, exist_ok=True)
    with open(os.path.join(ddir, 'osm-relation-tracks.json'), 'w') as f:
        f.write(json.dumps(out, indent=2) + '\n')
    cpath = os.path.join(ddir, 'track-centrelines.json')
    centre = json.load(open(cpath)) if os.path.exists(cpath) else {}
    added = 0
    fresh = set()
    for f in routes['features']:
        line = tracks.line_key(f['properties'])
        if line not in out['lines'] or f['properties'].get('future'):
            continue
        g = f['geometry']
        strings = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates'] if g['type'] == 'MultiLineString' else []
        # tolerate a MultiLineString written as a single line
        if strings and strings[0] and isinstance(strings[0][0], (int, float)):
            strings = [strings]
        if line in centre and not any(added_line == line for added_line in fresh):
            continue
        if line not in centre:
            centre[line] = []
            fresh.add(line)
            added += 1
        centre[line] += [[[round(p[0], 6), round(p[1], 6)] for p in s] for s in strings if len(s) >= 2]
    if added:
        body = ',\n'.join(f'  {json.dumps(k)}: [\n' + ',\n'.join(f'    {json.dumps(s)}' for s in v) + '\n  ]'
                          for k, v in sorted(centre.items()))
        with open(cpath, 'w') as f:
            f.write('{\n' + body + '\n}\n')
    print(f'wrote data-sources/{slug}/osm-relation-tracks.json' + (f'; saved {added} centreline(s)' if added else ''))


if __name__ == '__main__':
    main()
