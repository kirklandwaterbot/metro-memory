import type mapboxgl from 'mapbox-gl'

export const buildChinaSafeMapStyle = (
  darkMode: boolean,
  options?: { showLabels?: boolean },
): mapboxgl.Style => {
  // AMap raster tiles: style=7 for light road map, style=8 for dark mode
  // Inference from public tile endpoint behavior:
  // `scl=1` returns labeled tiles and `scl=2` returns the base map without labels.
  const showLabels = options?.showLabels ?? true
  const amapStyleId = darkMode ? '8' : '7'
  const scaleMode = showLabels ? '1' : '2'
  const tileUrl = `https://wprd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=${scaleMode}&style=${amapStyleId}&x={x}&y={y}&z={z}`

  return {
    version: 8,
    name: darkMode ? 'Metro Memory China Safe Dark' : 'Metro Memory China Safe Light',
    // Proxy the glyphs to avoid Great Firewall blocking api.mapbox.com
    // {fontstack} and {range} are supplied by mapbox-gl at runtime
    glyphs: '/api/geo/glyphs/{fontstack}/{range}.pbf',
    sources: {
      'amap-raster': {
        type: 'raster',
        tiles: [
          tileUrl,
          tileUrl.replace('wprd01', 'wprd02'),
          tileUrl.replace('wprd01', 'wprd03'),
          tileUrl.replace('wprd01', 'wprd04'),
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': darkMode ? '#09090b' : '#f5f5f4',
        },
      },
      {
        id: 'amap-layer',
        type: 'raster',
        source: 'amap-raster',
        minzoom: 0,
        maxzoom: 18,
        paint: {
          'raster-opacity': 1,
        },
      },
    ],
  }
}

/**
 * Style for playing a downloaded city without a connection: no tiles, just a
 * plain background under the game's own line and station layers. Glyphs come
 * from the same-origin proxy so the offline download can cache them.
 */
export const buildOfflineMapStyle = (darkMode: boolean): mapboxgl.Style => ({
  version: 8,
  name: darkMode ? 'Metro Memory Offline Dark' : 'Metro Memory Offline Light',
  glyphs: '/api/geo/glyphs/{fontstack}/{range}.pbf',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': darkMode ? '#18181b' : '#f4f4f5',
      },
    },
  ],
})
