import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Changchun Rail Transit',
    titleImage: 'asia/china/changchun/icon.ico',
    items: [
      {
        type: 'lines',
        lines: [
          'changchun1',
          'changchun2',
          'changchun3',
          'changchun4',
          'changchun6',
          'changchun8',
        ],
      },
    ],
  },
  {
    title: 'Changchun Public Transportation Group Tram Company',
    items: [
      {
        type: 'lines',
        lines: ['changchun54', 'changchun55'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/changchun',
    apple: '/api/city-icon/changchun',
  },
  title: 'Changchun Rail Transit Memory Game',
  description: 'How many of the Changchun Rail Transit stations can you name from memory?',
  openGraph: {
    title: 'Changchun Rail Transit Memory Game',
    description: 'How many of the Changchun Rail Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/changchun',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [125.1610619, 43.749932],
    [125.550358, 44.0092201],
  ],
  maxBounds: [
    [125.1, 43.68],
    [125.62, 44.08],
  ],
  minZoom: 9.7,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'changchun',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
