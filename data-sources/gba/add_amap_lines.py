#!/usr/bin/env python3
"""(Re)write GBA future lines from Amap line extracts.

Usage: python3 data-sources/gba/add_amap_lines.py <dir with <line-id>.json extracts>

Each extract is {"name", "open", "stations": [[zh, lon, lat], ...], "enc": "..."} as read
from an amap.com line page (station order, station positions and the drawn route, in
GCJ-02; "enc" is the route as delta-encoded 1e-5 degree pairs). Coordinates are converted
to WGS-84. Existing features and routes of the same line id are replaced. Stations already
in the GBA game (same Chinese name) keep the game's display name; the position always comes
from the extract.
"""
import json, math, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from build_future_lines import english, game_by_zh, GBA  # noqa: E402  (reuses naming helpers)

LINES = {
    # id: (file, display name, colour, original_city, English-name overrides)
    'szline19': ('sz19', 'Line 19', '#B0A8D5', 'sz', {'坪山人民医院': "Pingshan People's Hospital", '坪山剧院': 'Pingshan Theatre'}),
    'gzline28': ('gz28', 'Line 28', '#5C9E31', 'gz', {}),
    'fs_line4': ('fs4', 'Line 4', '#F08300', 'gz', {'博爱路': "Bo'ai Road", '下柏': 'Xiabo'}),
    'fs_line11': ('fs11', 'Line 11', '#00A0E9', 'gz', {'创智园': 'Enterprise City', '陈村东': 'Chencun East', '顺德站': 'Shunde Railway Station'}),
    'fs_tnh2': ('tnh2', 'Nanhai Tram Line 2', '#E85298', 'gz', {'青创城': 'Qingchuang City', '洲村': 'Zhoucun'}),
}

def gcj_to_wgs(lon, lat):
    a, ee = 6378245.0, 0.00669342162296594323
    def tl(x, y):
        r = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*math.sqrt(abs(x))
        r += (20*math.sin(6*x*math.pi) + 20*math.sin(2*x*math.pi)) * 2/3
        r += (20*math.sin(y*math.pi) + 40*math.sin(y/3*math.pi)) * 2/3
        r += (160*math.sin(y/12*math.pi) + 320*math.sin(y*math.pi/30)) * 2/3
        return r
    def tn(x, y):
        r = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*math.sqrt(abs(x))
        r += (20*math.sin(6*x*math.pi) + 20*math.sin(2*x*math.pi)) * 2/3
        r += (20*math.sin(x*math.pi) + 40*math.sin(x/3*math.pi)) * 2/3
        r += (150*math.sin(x/12*math.pi) + 300*math.sin(x/30*math.pi)) * 2/3
        return r
    dlat, dlon = tl(lon - 105, lat - 35), tn(lon - 105, lat - 35)
    rad = lat / 180 * math.pi
    m = 1 - ee * math.sin(rad) ** 2
    sm = math.sqrt(m)
    dlat = dlat * 180 / ((a * (1 - ee)) / (m * sm) * math.pi)
    dlon = dlon * 180 / (a / sm * math.cos(rad) * math.pi)
    return [round(lon - dlon, 6), round(lat - dlat, 6)]

def decode(enc):
    pts, x, y = [], 0, 0
    for tok in enc.split(','):
        dx, dy = map(int, tok.split())
        x += dx; y += dy
        pts.append(gcj_to_wgs(x / 1e5, y / 1e5))
    return pts

src = sys.argv[1]
fpath, rpath, lpath = (os.path.join(GBA, n) for n in ('features.json', 'routes.json', 'lines.json'))
features, routes, lines = json.load(open(fpath)), json.load(open(rpath)), json.load(open(lpath))
next_id = max(f['id'] for f in features['features']) + 1
max_order = max(v['order'] for v in lines.values())
for lid, (fname, name, color, city, overrides) in LINES.items():
    ext = json.load(open(os.path.join(src, f'{fname}.json')))
    order = lines.get(lid, {}).get('order') or (max_order := max_order + 1)
    features['features'] = [f for f in features['features'] if f['properties']['line'] != lid]
    routes['features'] = [r for r in routes['features'] if r['properties']['line'] != lid]
    names = []
    for i, (zh, lon, lat) in enumerate(ext['stations']):
        zh_key = re.sub(r'站$', '', zh)
        g = game_by_zh.get(zh) or game_by_zh.get(zh_key)
        if g and g['properties']['line'] != lid:
            label = g['properties']['name']
        else:
            label = f"{overrides.get(zh) or english(zh_key)} ({zh_key})"
        en = label.rsplit(' (', 1)[0]
        features['features'].append({
            'type': 'Feature', 'geometry': {'type': 'Point', 'coordinates': gcj_to_wgs(lon, lat)},
            'properties': {'id': next_id, 'name': label, 'long_name': f'{zh_key} {en}', 'alternate_names': [en, zh_key],
                           'line': lid, 'order': i, 'original_city': city, 'status': 'future'},
            'id': next_id})
        next_id += 1
        names.append(label)
    routes['features'].append({'type': 'Feature', 'geometry': {'type': 'MultiLineString', 'coordinates': [decode(ext['enc'])]},
                               'properties': {'line': lid, 'name': name, 'color': color, 'order': order}})
    lines[lid] = {'name': name, 'color': color, 'progressOutlineColor': color, 'backgroundColor': color,
                  'textColor': '#FFFFFF', 'order': order}
    print(f"- {lid} {name}: {len(names)} stations ({ext.get('open') or 'no date'}): " + ' · '.join(names))

open(fpath, 'w').write(json.dumps(features, ensure_ascii=False, indent=2) + '\n')
open(rpath, 'w').write(json.dumps(routes, ensure_ascii=False, indent=2) + '\n')
open(lpath, 'w').write(json.dumps(lines, ensure_ascii=False, indent=2) + '\n')
