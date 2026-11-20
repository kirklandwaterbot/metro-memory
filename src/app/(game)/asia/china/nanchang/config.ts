import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Nanchang Rail Transit',
    titleImage: 'asia/china/nanchang/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['nanchang1', 'nanchang2', 'nanchang3', 'nanchang4'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/nanchang',
    apple: '/api/city-icon/nanchang',
  },
  title: 'Nanchang Rail Transit Metro Memory',
  description: "How many of Nanchang's metro stations can you name from memory?",
  openGraph: {
    title: 'Nanchang Rail Transit Metro Memory',
    description: "How many of Nanchang's metro stations can you name from memory?",
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/nanchang',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [115.6, 28.35],
    [116.3, 29.1],
  ],
  maxBounds: [
    [115.3, 28.0],
    [116.6, 29.4],
  ],
  minZoom: 10.0,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'nanchang',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
