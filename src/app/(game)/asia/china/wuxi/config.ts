import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Wuxi Metro',
    titleImage: 'asia/china/wuxi/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['wuxi1', 'wuxi2', 'wuxi3', 'wuxi4', 'wuxis1'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/wuxi',
    apple: '/api/city-icon/wuxi',
  },
  title: 'Wuxi Metro Memory Game',
  description: 'How many of the Wuxi Metro stations can you name from memory?',
  openGraph: {
    title: 'Wuxi Metro Memory Game',
    description: 'How many of the Wuxi Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/wuxi',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [120.2086446, 31.4386805],
    [120.4640454, 31.9276194],
  ],
  maxBounds: [
    [120.16, 31.38],
    [120.52, 31.99],
  ],
  minZoom: 9.7,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'wuxi',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
