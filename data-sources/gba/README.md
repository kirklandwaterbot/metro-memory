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

Data © OpenStreetMap contributors (ODbL).
