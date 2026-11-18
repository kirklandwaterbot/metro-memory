#!/usr/bin/env python3
"""Add under-construction / planned GBA lines from an OSM probe snapshot.

Usage: python3 data-sources/gba/build_future_lines.py <osm-probe gba.json> [--dry-run]

For each line in future-lines.json it finds each station's coordinates:
  1. a station already in the GBA game with the same Chinese name (reuses its
     display name and position, so interchanges line up), else
  2. an OSM station/stop node of that name near the line's construction track
     (or anywhere in the snapshot for straight-track lines), else
  3. a point interpolated along the construction track between its known
     neighbours (reported as approximate).
Track is the OSM construction/proposed track near the line's stations, or
straight segments between stations when OSM has no track. Run
scripts/gba-add-romanizations.js afterwards for the alias lists.
"""
import json, math, re, sys, os
from pypinyin import lazy_pinyin

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
GBA = os.path.join(ROOT, 'src', 'app', '(game)', 'asia', 'china', 'gba', 'data')
SPEC = json.load(open(os.path.join(os.path.dirname(__file__), 'future-lines.json')))

def hav(a, b):
    k = math.cos(math.radians((a[1] + b[1]) / 2)) * 111320
    return math.hypot((a[0] - b[0]) * k, (a[1] - b[1]) * 110540)

def seg(p, a, b):
    k = math.cos(math.radians(p[1])) * 111320
    px, py, ax, ay, bx, by = p[0]*k, p[1]*110540, a[0]*k, a[1]*110540, b[0]*k, b[1]*110540
    dx, dy = bx - ax, by - ay
    L = dx*dx + dy*dy
    f = max(0, min(1, ((px-ax)*dx + (py-ay)*dy) / L)) if L else 0
    return math.hypot(px - (ax + f*dx), py - (ay + f*dy)), f

def dist_to(lines, p):
    return min((seg(p, a, b)[0] for l in lines for a, b in zip(l, l[1:])), default=1e18)

def zh_of(t):
    n = t.get('name:zh') or t.get('name') or ''
    n = re.sub(r'\s+[A-Za-z].*$', '', n)
    n = re.sub(r'（[^）]*）|\([^)]*\)', '', n)
    n = re.sub(r'^\d+号线', '', n.strip())
    return re.sub(r'站$', '', n.strip()).strip()

BAD = re.compile(r'汽车|公交|码头|碼頭|巴士|客运|總$|总$|接駁')
features = json.load(open(os.path.join(GBA, 'features.json')))
routes = json.load(open(os.path.join(GBA, 'routes.json')))
lines_json = json.load(open(os.path.join(GBA, 'lines.json')))

game_by_zh = {}
for f in features['features']:
    m = re.search(r'\(([^()]*)\)\s*$', f['properties']['name'])
    if m:
        game_by_zh.setdefault(re.sub(r'站$', '', m.group(1)), f)

PLACE = [('工业区', 'Industrial Zone'), ('街道', 'Subdistrict'), ('大道', 'Avenue'), ('公园', 'Park'), ('公園', 'Park'),
         ('医院', 'Hospital'), ('市场', 'Market'), ('渡口', 'Ferry'), ('新城', 'New Town'), ('寺', 'Temple'),
         ('村', 'Village'), ('湖', 'Lake'), ('路', 'Road')]
DIRS = {'东': 'East', '西': 'West', '南': 'South', '北': 'North', '中': 'Middle'}

def py(zh):
    return ''.join(lazy_pinyin(zh)).title()

def english(zh, tags=None):
    """OSM name:en when present, else pinyin plus translated place words,
    in the GBA data's style: 季华东路 -> Jihua East Road, 绿岛湖北 -> Lvdao Lake North."""
    if tags and tags.get('name:en') and not re.search(r'Under Construction|Reversed', tags['name:en']):
        return re.sub(r'\s*Station$', '', tags['name:en']).strip()
    core, words = zh, []
    # trailing direction (绿岛湖北, 三山新城南)
    if len(core) > 2 and core[-1] in DIRS and not any(core.endswith(p) for p, _ in PLACE):
        words.insert(0, DIRS[core[-1]]); core = core[:-1]
    for p, e in PLACE:
        if core.endswith(p) and len(core) > len(p):
            core = core[:-len(p)]
            # direction just before the place word (季华东路 -> Jihua East Road)
            if p == '路' and len(core) > 2 and core[-1] in DIRS:
                words.insert(0, DIRS[core[-1]]); core = core[:-1]
                words.insert(1, e)
            else:
                words.insert(0, e)
            break
    return ' '.join([py(core)] + words)

def works_for(pattern):
    r = re.compile(pattern)
    out = []
    for w in probe['works']:
        t = w['tags']
        if r.search(' | '.join(str(t.get(k, '')) for k in ('name', 'name:en', 'ref', 'line'))):
            out += w['lines']
    return out

def main():
    global probe
    probe = json.load(open(sys.argv[1]))
    dry = '--dry-run' in sys.argv
    report = []
    next_id = max(f['id'] for f in features['features']) + 1
    max_order = max(v['order'] for v in lines_json.values())
    for li, spec in enumerate(SPEC['lines']):
        if spec['id'] in lines_json:
            report.append(f"- {spec['id']}: already in lines.json, skipped")
            continue
        track = works_for(spec['track'][6:]) if spec['track'].startswith('works:') else []
        stations = []
        for entry in spec['stations']:
            entry, _, en_override = entry.partition('=')  # "中文=English" fixes a name
            names = entry.split('|')
            hit = None
            for n in names:
                g = game_by_zh.get(n) or game_by_zh.get(re.sub(r'站$', '', n))
                if g:
                    hit = {'zh': n, 'name': g['properties']['name'], 'p': g['geometry']['coordinates'], 'src': 'game'}
                    break
            if not hit:
                best = None
                for s in probe['stations']:
                    z = zh_of(s['tags'])
                    if z not in [re.sub(r'站$', '', n) for n in names] or (BAD.search(s['tags'].get('name', '')) and not BAD.search(z)):
                        continue
                    p = [s['lon'], s['lat']]
                    d = dist_to(track, p) if track else 0
                    if d < 600 and (best is None or d < best[0]):
                        best = (d, s, p, z)
                if best:
                    zh = re.sub(r'站$', '', names[0])
                    tags = best[1]['tags'] if best[3] == zh else None
                    hit = {'zh': zh, 'name': f"{english(zh, tags)} ({zh})", 'p': best[2], 'src': 'osm'}
            if not hit:
                zh = re.sub(r'站$', '', names[0])
                hit = {'zh': zh, 'name': f"{english(zh)} ({zh})", 'p': None, 'src': 'approx'}
            if en_override and hit['src'] != 'game':
                hit['name'] = f"{en_override} ({hit['zh']})"
            stations.append(hit)
        # Interpolate missing positions between known neighbours, snapped to the track.
        known = [i for i, s in enumerate(stations) if s['p']]
        if not known:
            report.append(f"- {spec['id']}: no station positions found, skipped")
            continue
        for i, s in enumerate(stations):
            if s['p']:
                continue
            before = [k for k in known if k < i]
            after = [k for k in known if k > i]
            if before and after:
                a, b = stations[before[-1]]['p'], stations[after[0]]['p']
                f = (i - before[-1]) / (after[0] - before[-1])
            else:  # extrapolate from the two nearest known stations
                k1, k2 = (known[0], known[1]) if not before else (known[-2], known[-1])
                a, b = stations[k1]['p'], stations[k2]['p']
                f = (i - k1) / (k2 - k1)
            p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
            if track:  # pull onto the nearest track point
                best = min(((hav(p, q), q) for l in track for q in l), key=lambda x: x[0])
                if best[0] < 3000:
                    p = best[1]
            s['p'] = [round(p[0], 6), round(p[1], 6)]
        if spec.get('orderBy') == 'tour':
            rest = stations[:]
            start = max(rest, key=lambda s: hav(s['p'], [sum(x['p'][0] for x in rest)/len(rest), sum(x['p'][1] for x in rest)/len(rest)]))
            tour = [start]; rest.remove(start)
            while rest:
                nxt = min(rest, key=lambda s: hav(s['p'], tour[-1]['p'])); tour.append(nxt); rest.remove(nxt)
            stations = tour
        # Features
        for order, s in enumerate(stations):
            zh = s['zh']
            en = s['name'].rsplit(' (', 1)[0]
            features['features'].append({
                'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': s['p']},
                'properties': {'id': next_id, 'name': s['name'], 'long_name': f'{zh} {en}', 'alternate_names': [en, zh],
                               'line': spec['id'], 'order': order, 'original_city': spec['city'], 'status': 'future'},
                'id': next_id})
            next_id += 1
        # Track
        pts = [s['p'] for s in stations] + ([stations[0]['p']] if spec.get('loop') else [])
        if track:
            near = [l for l in track if any(min(hav(q, s['p']) for s in stations) < 2500 for q in l)]
            geom = near or [pts]
        else:
            geom = [pts]
        routes['features'].append({'type': 'Feature', 'geometry': {'type': 'MultiLineString', 'coordinates': geom},
                                   'properties': {'line': spec['id'], 'name': spec['name'], 'color': spec['color'], 'order': max_order + 1 + li}})
        lines_json[spec['id']] = {'name': spec['name'], 'color': spec['color'], 'progressOutlineColor': spec['color'],
                                  'backgroundColor': spec['color'], 'textColor': '#FFFFFF', 'order': max_order + 1 + li}
        approx = [s['zh'] for s in stations if s['src'] == 'approx']
        report.append(f"- {spec['id']} {spec['name']}: {len(stations)} stations"
                      f" (game {sum(s['src']=='game' for s in stations)}, OSM {sum(s['src']=='osm' for s in stations)}, approx {len(approx)}{': ' + '、'.join(approx) if approx else ''}),"
                      f" track {'OSM construction' if track else 'straight'}")
        report.append('  - ' + ' · '.join(s['name'] for s in stations))

    print('\n'.join(report))
    if not dry:
        json.dump(features, open(os.path.join(GBA, 'features.json'), 'w'), ensure_ascii=False, indent=2)
        open(os.path.join(GBA, 'features.json'), 'a').write('\n')
        json.dump(routes, open(os.path.join(GBA, 'routes.json'), 'w'), ensure_ascii=False)
        json.dump(lines_json, open(os.path.join(GBA, 'lines.json'), 'w'), ensure_ascii=False, indent=2)
        open(os.path.join(GBA, 'lines.json'), 'a').write('\n')


if __name__ == '__main__':
    main()
