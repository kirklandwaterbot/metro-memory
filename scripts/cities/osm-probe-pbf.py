#!/usr/bin/env python3
"""
OSM probe from a Geofabrik extract instead of Overpass.

Writes the same snapshot as scripts/cities/osm-probe.js (relations with
their stops, stations, and with "routeGeometry" the track of each operating
route), for request files that set "extract" (a Geofabrik region such as
"asia/china"). The Overpass servers often hang on these areas; a regional
extract filtered with osmium is quick and reliable.

  python3 scripts/cities/osm-probe-pbf.py --pbf=area.osm.pbf --request=data-sources/probes/requests/wuhan.json --out=/tmp/out

Needs `pip install osmium`. Data © OpenStreetMap contributors (ODbL).
"""
import argparse
import json
import os
import re
from datetime import datetime, timezone

import osmium

STOP_ROLE = re.compile(r"stop|platform")
ROUTES = {"subway", "light_rail", "tram", "monorail", "train", "railway"}
GEOM_ROUTES = {"subway", "light_rail", "tram", "monorail"}
SUBURBAN = re.compile(r"Suburban|Commuter|市郊|市域|S-Bahn", re.I)


def R(v):
    return round(v, 6)


def state_of(t):
    if (
        t.get("railway") == "construction"
        or t.get("construction:railway")
        or t.get("construction") == "yes"
        or t.get("state") == "construction"
    ):
        return "construction"
    if t.get("railway") == "proposed" or t.get("proposed:railway") or t.get("state") in ("proposed", "planned"):
        return "proposed"
    return "open"


def is_station(t):
    return (
        t.get("railway") in ("station", "halt", "tram_stop")
        or t.get("public_transport") == "station"
        or re.search(r"station|halt|stop", t.get("construction:railway", "") or "")
        or re.search(r"station|halt|stop", t.get("proposed:railway", "") or "")
    )


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        ln = ((bx - ax) ** 2 + (by - ay) ** 2) ** 0.5 or 1e-12
        best, idx = 0, -1
        for i in range(a + 1, b):
            d = abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / ln
            if d > best:
                best, idx = d, i
        if best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


class Collect(osmium.SimpleHandler):
    def __init__(self, bbox):
        super().__init__()
        self.s, self.w, self.n, self.e = bbox
        self.nodes = {}
        self.ways = {}
        self.wtags = {}
        self.rels = []
        self.stations = []

    def inside(self, lon, lat):
        return self.w <= lon <= self.e and self.s <= lat <= self.n

    def node(self, n):
        if not n.location.valid():
            return
        t = dict(n.tags)
        lon, lat = n.location.lon, n.location.lat
        self.nodes[n.id] = (lon, lat, t)
        if is_station(t) and (t.get("name") or t.get("name:en")) and self.inside(lon, lat):
            self.stations.append({"id": f"node/{n.id}", "lon": R(lon), "lat": R(lat), "state": state_of(t), "tags": t})

    def way(self, w):
        try:
            pts = [(n.location.lon, n.location.lat) for n in w.nodes if n.location.valid()]
        except osmium.InvalidLocationError:
            return
        if len(pts) < 1:
            return
        t = dict(w.tags)
        self.ways[w.id] = pts
        self.wtags[w.id] = t
        if is_station(t) and (t.get("name") or t.get("name:en")):
            lon = sum(p[0] for p in pts) / len(pts)
            lat = sum(p[1] for p in pts) / len(pts)
            if self.inside(lon, lat):
                self.stations.append({"id": f"way/{w.id}", "lon": R(lon), "lat": R(lat), "state": state_of(t), "tags": t})

    def relation(self, r):
        t = dict(r.tags)
        if t.get("type") not in ("route", "proposed", "construction"):
            return
        route = t.get("route") or t.get("construction:route") or t.get("proposed:route")
        if route not in ROUTES and route not in ("construction", "proposed"):
            return
        self.rels.append({"id": r.id, "tags": t, "members": [(m.type, m.ref, m.role) for m in r.members]})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pbf", required=True)
    ap.add_argument("--request", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    req = json.load(open(a.request))
    h = Collect(req["bbox"])
    h.apply_file(a.pbf, locations=True)
    with_geom = bool(req.get("routeGeometry"))

    route_ways = {}
    relations = []
    for r in h.rels:
        t = r["tags"]
        # keep relations that touch the area
        touches = False
        stops = []
        for typ, ref, role in r["members"]:
            if not STOP_ROLE.search(role or ""):
                continue
            if typ == "n" and ref in h.nodes:
                lon, lat, nt = h.nodes[ref]
            elif typ == "w" and ref in h.ways:
                pts = h.ways[ref]
                lon = sum(p[0] for p in pts) / len(pts)
                lat = sum(p[1] for p in pts) / len(pts)
                nt = h.wtags.get(ref, {})
            else:
                continue
            touches = touches or h.inside(lon, lat)
            stops.append({"name": nt.get("name"), "nameEn": nt.get("name:en"), "lon": R(lon), "lat": R(lat), "role": role})
        ways = [ref for typ, ref, role in r["members"] if typ == "w" and ref in h.ways and not STOP_ROLE.search(role or "")]
        if not touches:
            touches = any(h.inside(*h.ways[w][0]) for w in ways[:50])
        if not touches:
            continue
        rel = {"id": r["id"], "tags": t, "stops": stops, "members": len(r["members"])}
        route = t.get("route")
        if with_geom and state_of(t) == "open" and (
            route in GEOM_ROUTES or (route == "train" and SUBURBAN.search(t.get("network", "") or ""))
        ):
            kept = []
            for w in ways:
                if "railway" not in h.wtags.get(w, {}):
                    continue
                if w not in route_ways:
                    route_ways[w] = [[R(x), R(y)] for x, y in simplify(h.ways[w], 0.00001)]
                kept.append(w)
            rel["ways"] = kept
        relations.append(rel)

    out = {
        "slug": req["slug"],
        "bbox": req["bbox"],
        "requestVersion": req.get("version", 1),
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source": "geofabrik",
        "relations": relations,
        "stations": h.stations,
        "works": [],
    }
    if with_geom:
        out["routeWays"] = {str(k): v for k, v in route_ways.items()}
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, f"{req['slug']}.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{req['slug']}: {len(relations)} relations, {len(h.stations)} stations, {len(route_ways)} route ways")


if __name__ == "__main__":
    main()
