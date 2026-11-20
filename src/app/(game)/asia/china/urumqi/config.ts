import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Ürümqi Metro',
    titleImage: 'asia/china/urumqi/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['urumqi1', 'urumqi2', 'urumqi4'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/urumqi',
    apple: '/api/city-icon/urumqi',
  },
  title: 'Ürümqi Metro Memory Game',
  description: 'How many of the Ürümqi Metro stations can you name from memory?',
  openGraph: {
    title: 'Ürümqi Metro Memory Game',
    description: 'How many of the Ürümqi Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/urumqi',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [87.43, 43.74],
    [87.66, 43.93],
  ],
  maxBounds: [
    [87.3, 43.65],
    [87.8, 44.05],
  ],
  minZoom: 10.5,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'urumqi',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
