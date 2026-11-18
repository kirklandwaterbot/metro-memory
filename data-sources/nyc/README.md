# Reference geometry for New York

Used only by `scripts/routes/fill-gaps.js` as backup track when filling gaps.
Hand-drawn track in the game data is always preferred, because reference edges
cost 1.5× as much. These files are never shown in the game directly.

| file | contents | used for |
| --- | --- | --- |
| `njt-rail-gtfs-shapes.geojson` | one route shape per NJ Transit rail line, from NJ Transit GTFS | commuter-rail gaps, plus **coverage**: wherever the official route runs but the drawn NJT line doesn't (e.g. into Hoboken / NY Penn) |
| `subway-gtfs-shapes.geojson` | one route shape per current NYC Subway service, from MTA GTFS | subway gaps between *your* stations only (the NYC map is a future network, so these never decide where a line goes) |

Source: [Cincinnatus101010/njtrains](https://github.com/Cincinnatus101010/njtrains),
`wwwroot/data/`, commit `64d9a32` (2026-09-16), built from NJ Transit and MTA
GTFS by that repo's `scripts/build-njt-rail-geojson.py` and
`scripts/build-subway-tracks.py`. The schedule data itself remains NJ Transit's and MTA's.

## `osm-routes.json`

Lines drawn along their real right-of-way from **OpenStreetMap** by
`scripts/routes/osm-route.js`. It runs in the *Route Geometry from
OpenStreetMap* GitHub Action whenever this file changes. Route features built
this way carry an `osm_route` property and are © OpenStreetMap contributors,
available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).

## License of the njtrains files

MIT License

Copyright (c) 2026 Ian Troisi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
