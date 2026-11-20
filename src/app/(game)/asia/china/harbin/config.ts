import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Harbin Metro',
    titleImage: 'asia/china/harbin/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['harbin1', 'harbin2', 'harbin3'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/harbin',
    apple: '/api/city-icon/harbin',
  },
  title: 'Harbin Metro Memory Game',
  description: 'How many of the Harbin Metro stations can you name from memory?',
  openGraph: {
    title: 'Harbin Metro Memory Game',
    description: 'How many of the Harbin Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/harbin',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [126.32, 45.58],
    [126.99, 45.93],
  ],
  maxBounds: [
    [126.0, 45.3],
    [127.3, 46.15],
  ],
  minZoom: 9,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'harbin',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
