import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Nantong Rail Transit',
    titleImage: 'asia/china/nantong/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['nantong1', 'nantong2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/nantong',
    apple: '/api/city-icon/nantong',
  },
  title: 'Nantong Rail Transit Memory Game',
  description: 'How many of the Nantong Rail Transit stations can you name from memory?',
  openGraph: {
    title: 'Nantong Rail Transit Memory Game',
    description: 'How many of the Nantong Rail Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/nantong',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [120.74, 31.89],
    [120.99, 32.13],
  ],
  maxBounds: [
    [120.7, 31.85],
    [121.03, 32.17],
  ],
  minZoom: 10.2,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'nantong',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
