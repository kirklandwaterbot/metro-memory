import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'

import { Config, Line, LineGroup } from '@/lib/types'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Fuzhou Metro',
    titleImage: 'asia/china/fuzhou/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['fuzhou1', 'fuzhou2', 'fuzhou4', 'fuzhou5', 'fuzhou6', 'fuzhouf1'],
      },
    ],
  },
  {
    title: 'Fuzhou Nanfang Cableway Co., Ltd',
    items: [
      {
        type: 'lines',
        lines: ['gushan'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/fuzhou',
    apple: '/api/city-icon/fuzhou',
  },
  title: 'Fuzhou Metro Memory Game',
  description: 'How many Fuzhou Metro stations can you name from memory?',
  openGraph: {
    title: 'Fuzhou Metro Memory Game',
    description: 'How many Fuzhou Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/fuzhou',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [119.1546395, 25.8669626],
    [119.6090227, 26.1453045],
  ],
  maxBounds: [
    [119.05, 25.75],
    [119.7, 26.25],
  ],
  minZoom: 9.8,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'fuzhou',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
