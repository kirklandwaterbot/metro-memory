import type { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import type { Config, Line, LineGroup } from '@/lib/types'
import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Sanya Rail Transit Co., Ltd',
    titleImage: 'asia/china/sanya/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['SanyaTramT1'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/sanya',
    apple: '/api/city-icon/sanya',
  },
  title: 'Sanya Tram Memory Game',
  description: 'How many Sanya Tram T1 stations can you name from memory?',
  openGraph: {
    title: 'Sanya Tram Memory Game',
    description: 'How many Sanya Tram T1 stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/sanya',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clqxldtyh013n01nw6w7ihjll',
  bounds: [
    [109.48, 18.23],
    [109.51, 18.31],
  ],
  maxBounds: [
    [108.98, 17.73],
    [110.01, 18.81],
  ],
  minZoom: 11,
  fadeDuration: 50,
}

export const CITY_NAME = 'sanya'

export const LOCALE = 'en'

export const MAP_FROM_DATA = true

export const GAUGE_COLORS = 'inverted'

const config: Config = {
  GAUGE_COLORS,
  MAP_FROM_DATA,
  LOCALE,
  CITY_NAME,
  LINE_GROUPS,
  MAP_CONFIG,
  METADATA,
  LINES,
}

export default config
