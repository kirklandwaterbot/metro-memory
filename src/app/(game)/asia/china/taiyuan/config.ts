import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Taiyuan Metro',
    titleImage: 'asia/china/taiyuan/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['taiyuan1', 'taiyuan2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/taiyuan',
    apple: '/api/city-icon/taiyuan',
  },
  title: 'Taiyuan Metro Memory Game',
  description: 'How many of the Taiyuan Metro stations can you name from memory?',
  openGraph: {
    title: 'Taiyuan Metro Memory Game',
    description: 'How many of the Taiyuan Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/taiyuan',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [112.42, 37.69],
    [112.65, 37.93],
  ],
  maxBounds: [
    [112.36, 37.62],
    [112.72, 37.99],
  ],
  minZoom: 10.4,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'taiyuan',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
