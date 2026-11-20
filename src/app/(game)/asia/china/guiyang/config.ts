import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Guiyang Urban Rail Transit (GYURT)',
    titleImage: 'asia/china/guiyang/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['guiyang1', 'guiyang2', 'guiyang3', 'guiyangs1', 'guiyangt2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/guiyang',
    apple: '/api/city-icon/guiyang',
  },
  title: 'Guiyang Urban Rail Transit Metro Memory',
  description: "How many of Guiyang's metro and tram stations can you name from memory?",
  openGraph: {
    title: 'Guiyang Urban Rail Transit Metro Memory',
    description: "How many of Guiyang's metro and tram stations can you name from memory?",
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/guiyang',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [106.04, 26.26],
    [107.49, 27.19],
  ],
  maxBounds: [
    [105.84, 26.0],
    [107.69, 27.39],
  ],
  minZoom: 9.8,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'guiyang',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
