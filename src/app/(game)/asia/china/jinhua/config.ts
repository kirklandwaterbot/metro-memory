import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Jinhua Rail Transit',
    titleImage: 'asia/china/jinhua/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['jinhua-jyd'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/jinhua',
    apple: '/api/city-icon/jinhua',
  },
  title: 'Jinhua Rail Transit Memory Game',
  description: 'How many Jinhua Rail Transit stations can you name from memory?',
  openGraph: {
    title: 'Jinhua Rail Transit Memory Game',
    description: 'How many Jinhua Rail Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/jinhua',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [119.5, 29.0],
    [120.4, 29.45],
  ],
  maxBounds: [
    [119.2, 28.85],
    [120.7, 29.65],
  ],
  minZoom: 9.8,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'jinhua',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
