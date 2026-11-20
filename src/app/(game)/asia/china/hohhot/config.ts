import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Hohhot Metro',
    titleImage: 'asia/china/hohhot/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['hohhot1', 'hohhot2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/hohhot',
    apple: '/api/city-icon/hohhot',
  },
  title: 'Hohhot Metro Memory Game',
  description: 'How many of the Hohhot Metro stations can you name from memory?',
  openGraph: {
    title: 'Hohhot Metro Memory Game',
    description: 'How many of the Hohhot Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/hohhot',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [111.55, 40.68],
    [112.0, 41.0],
  ],
  maxBounds: [
    [111.3, 40.5],
    [112.2, 41.2],
  ],
  minZoom: 11,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'hohhot',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
