import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'

import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Dalian Metro',
    titleImage: 'asia/china/dalian/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['Line1', 'Line2', 'Line3', 'Line4', 'Line5', 'Line12', 'Line13'],
      },
    ],
  },
  {
    title: 'Dalian Trams',
    items: [
      {
        type: 'lines',
        lines: ['Tram201', 'Tram202'],
      },
    ],
  },
  {
    title: 'Dalian Zoo',
    items: [
      {
        type: 'lines',
        lines: ['HaidaCableway'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/dalian',
    apple: '/api/city-icon/dalian',
  },
  title: 'Dalian (大连) Metro Memory',
  description:
    'How many Dalian (大连) metro, tram, and Haida Cableway stops can you name from memory?',
  openGraph: {
    title: 'Dalian (大连) Metro Memory',
    description:
      'How many Dalian (大连) metro, tram, and Haida Cableway stops can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/dalian',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clnx0tw77005n01qsfyeya61u',
  bounds: [
    [121.05355108, 38.738175655917644],
    [122.08703452, 39.493958984905916],
  ],
  maxBounds: [
    [120.8, 38.5],
    [122.4, 39.7],
  ],
  minZoom: 7,
  fadeDuration: 50,
}

export const CITY_NAME = 'dalian'

export const LOCALE = 'en'

export const MAP_FROM_DATA = true

export const GAUGE_COLORS = 'inverted'

const config: Config = {
  MAP_FROM_DATA,
  GAUGE_COLORS,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
