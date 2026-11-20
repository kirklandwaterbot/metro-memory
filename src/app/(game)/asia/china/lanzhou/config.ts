import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Lanzhou Metro',
    titleImage: 'asia/china/lanzhou/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['lanzhou1', 'lanzhou2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/lanzhou',
    apple: '/api/city-icon/lanzhou',
  },
  title: 'Lanzhou Metro Memory Game',
  description: 'How many of the Lanzhou Metro stations can you name from memory?',
  openGraph: {
    title: 'Lanzhou Metro Memory Game',
    description: 'How many of the Lanzhou Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/lanzhou',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [103.63, 36.02],
    [104.0, 36.20],
  ],
  maxBounds: [
    [103.5, 35.95],
    [104.15, 36.3],
  ],
  minZoom: 11,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'lanzhou',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
