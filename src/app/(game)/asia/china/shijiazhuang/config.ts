import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Shijiazhuang Metro',
    titleImage: 'asia/china/shijiazhuang/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['shijiazhuang1', 'shijiazhuang2', 'shijiazhuang3'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/shijiazhuang',
    apple: '/api/city-icon/shijiazhuang',
  },
  title: 'Shijiazhuang Metro Memory',
  description: "How many of Shijiazhuang's metro stations can you name from memory?",
  openGraph: {
    title: 'Shijiazhuang Metro Memory',
    description: "How many of Shijiazhuang's metro stations can you name from memory?",
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/shijiazhuang',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [114.35, 37.96],
    [114.68, 38.17],
  ],
  maxBounds: [
    [114.2, 37.85],
    [114.8, 38.27],
  ],
  minZoom: 10.7,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'shijiazhuang',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
