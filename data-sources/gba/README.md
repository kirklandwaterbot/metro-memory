# Greater Bay Area: future lines

`future-lines.json` lists under-construction and planned lines that were added to the GBA map
from an OpenStreetMap snapshot (the `osm-probes` branch, `gba.json`, written by the **OSM Probe** Action).

```bash
git fetch origin osm-probes && git show origin/osm-probes:gba.json > /tmp/gba.json
pip install pypinyin
python3 data-sources/gba/build_future_lines.py /tmp/gba.json --dry-run   # report only
python3 data-sources/gba/build_future_lines.py /tmp/gba.json             # write data
node scripts/gba-add-romanizations.js && node scripts/generate-station-totals.js
```

Lines already in `lines.json` are skipped, so it is safe to re-run after adding a new entry.
Station positions come from the game (interchanges), then OSM station/stop nodes, then a point
interpolated along the OSM construction track. `future-lines-report.md` lists which stations were
interpolated so they can be checked on OpenRailwayMap. New stations carry `"status": "future"`.

### From Amap

Shenzhen Line 19, Guangzhou Line 28 (Guangzhou section), Foshan Lines 4 and 11 and Nanhai Tram
Line 2 come from the line pages on amap.com (station order, station positions, drawn route),
converted from GCJ-02 to WGS-84 by `add_amap_lines.py`, which replaces those lines on each run:

```bash
python3 data-sources/gba/add_amap_lines.py <folder of extracts: sz19.json, gz28.json, fs4.json, fs11.json, tnh2.json>
```

Amap doesn't list intercity railways as lines, so the under-construction intercity lines are not included.

OSM data © OpenStreetMap contributors (ODbL). Amap-derived positions © AutoNavi (高德).
