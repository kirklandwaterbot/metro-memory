import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Wuhu Rail Transit',
    titleImage: 'asia/china/wuhu/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['wuhu1', 'wuhu2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/wuhu',
    apple: '/api/city-icon/wuhu',
  },
  title: 'Wuhu Rail Transit Memory Game',
  description: 'How many of the Wuhu Rail Transit stations can you name from memory?',
  openGraph: {
    title: 'Wuhu Rail Transit Memory Game',
    description: 'How many of the Wuhu Rail Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/wuhu',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [118.34, 31.23],
    [118.52, 31.5],
  ],
  maxBounds: [
    [118.28, 31.18],
    [118.58, 31.55],
  ],
  minZoom: 10.5,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'wuhu',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
