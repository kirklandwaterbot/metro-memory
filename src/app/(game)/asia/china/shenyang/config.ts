import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Shenyang Metro',
    titleImage: 'asia/china/shenyang/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['shenyang1', 'shenyang2', 'shenyang3', 'shenyang4', 'shenyang9', 'shenyang10'],
      },
    ],
  },
  {
    title: 'Shenyang Modern Tram',
    titleImage: 'asia/china/shenyang/shenyangtramlogo.png',
    items: [
      {
        type: 'lines',
        lines: ['shenyangtram1', 'shenyangtram3', 'shenyangtram5'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/shenyang',
    apple: '/api/city-icon/shenyang',
  },
  title: 'Shenyang Metro Memory Game',
  description: 'How many of the Shenyang Metro and Tram stations can you name from memory?',
  openGraph: {
    title: 'Shenyang Metro Memory Game',
    description: 'How many of the Shenyang Metro and Tram stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/shenyang',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [123.07, 41.6],
    [123.77, 42.01],
  ],
  maxBounds: [
    [122.87, 41.4],
    [123.97, 42.21],
  ],
  minZoom: 9.5,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'shenyang',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
