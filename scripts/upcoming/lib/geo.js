// Small geometry helpers (coordinates are [lon, lat] like GeoJSON).

const R = 6371000

function haversine([lon1, lat1], [lon2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Distance from point p to segment ab using a local equirectangular projection.
function pointSegmentDistance(p, a, b) {
  const k = Math.cos((p[1] * Math.PI) / 180)
  const px = p[0] * k
  const ax = a[0] * k
  const bx = b[0] * k
  const dx = bx - ax
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  let t = len2 ? ((px - ax) * dx + (p[1] - a[1]) * dy) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  const proj = [(ax + t * dx) / k, a[1] + t * dy]
  return { distance: haversine(p, proj), point: proj }
}

function lineStrings(geometry) {
  if (!geometry) return []
  if (geometry.type === 'LineString') return [geometry.coordinates]
  if (geometry.type === 'MultiLineString') return geometry.coordinates
  return []
}

/** Nearest point on any of the given route features to `p`. */
function nearestOnRoutes(p, routeFeatures) {
  let best = null
  for (const f of routeFeatures) {
    for (const coords of lineStrings(f.geometry)) {
      for (let i = 0; i < coords.length - 1; i += 1) {
        const r = pointSegmentDistance(p, coords[i], coords[i + 1])
        if (!best || r.distance < best.distance) best = { ...r, feature: f }
      }
      if (coords.length === 1) {
        const d = haversine(p, coords[0])
        if (!best || d < best.distance) best = { distance: d, point: coords[0], feature: f }
      }
    }
  }
  return best
}

/** Bounding box [minLat, minLon, maxLat, maxLon] of point features, padded. */
function bboxOfFeatures(features, padDeg = 0.04, padRatio = 0.15) {
  let minLat = Infinity
  let minLon = Infinity
  let maxLat = -Infinity
  let maxLon = -Infinity
  for (const f of features) {
    const c = f?.geometry?.coordinates
    if (!Array.isArray(c) || typeof c[0] !== 'number') continue
    minLon = Math.min(minLon, c[0])
    maxLon = Math.max(maxLon, c[0])
    minLat = Math.min(minLat, c[1])
    maxLat = Math.max(maxLat, c[1])
  }
  if (!Number.isFinite(minLat)) return null
  const padLat = Math.max(padDeg, (maxLat - minLat) * padRatio)
  const padLon = Math.max(padDeg, (maxLon - minLon) * padRatio)
  return [minLat - padLat, minLon - padLon, maxLat + padLat, maxLon + padLon]
}

module.exports = { haversine, pointSegmentDistance, nearestOnRoutes, bboxOfFeatures, lineStrings }
