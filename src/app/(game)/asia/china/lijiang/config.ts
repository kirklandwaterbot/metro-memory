import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Lijiang Snow Mountain Rail Transit Co., Ltd',
    titleImage: 'asia/china/lijiang/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['lijiang1'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/lijiang',
    apple: '/api/city-icon/lijiang',
  },
  title: 'Lijiang Rail Transit Memory Game',
  description: 'How many Lijiang Rail Transit Line 1 stations can you name from memory?',
  openGraph: {
    title: 'Lijiang Rail Transit Memory Game',
    description: 'How many Lijiang Rail Transit Line 1 stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/lijiang',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [100.225, 26.935],
    [100.273, 27.106],
  ],
  maxBounds: [
    [100.2, 26.9],
    [100.3, 27.14],
  ],
  minZoom: 10.5,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'lijiang',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
