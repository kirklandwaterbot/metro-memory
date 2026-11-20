import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Changzhou Metro',
    titleImage: 'asia/china/changzhou/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['changzhou1', 'changzhou2', 'changzhou5', 'changzhou6'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/changzhou',
    apple: '/api/city-icon/changzhou',
  },
  title: 'Changzhou Metro Memory Game',
  description: 'How many of the Changzhou Metro stations can you name from memory?',
  openGraph: {
    title: 'Changzhou Metro Memory Game',
    description: 'How many of the Changzhou Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/changzhou',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [119.84, 31.62],
    [120.08, 31.91],
  ],
  maxBounds: [
    [119.7, 31.55],
    [120.2, 31.97],
  ],
  minZoom: 10.7,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'changzhou',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
