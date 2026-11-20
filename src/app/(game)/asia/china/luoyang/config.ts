import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Luoyang Subway',
    titleImage: 'asia/china/luoyang/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['luoyang1', 'luoyang2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/luoyang',
    apple: '/api/city-icon/luoyang',
  },
  title: 'Luoyang Subway Memory Game',
  description: 'How many of the Luoyang Subway stations can you name from memory?',
  openGraph: {
    title: 'Luoyang Subway Memory Game',
    description: 'How many of the Luoyang Subway stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/luoyang',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [112.3, 34.58],
    [112.56, 34.72],
  ],
  maxBounds: [
    [112.25, 34.55],
    [112.62, 34.75],
  ],
  minZoom: 10.4,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'luoyang',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
