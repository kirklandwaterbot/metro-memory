import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Shanghai Metro',
    titleImage: 'asia/china/shanghai/shanghaimetro.png',
    items: [
      {
        type: 'lines',
        lines: [
          'shanghai1',
          'shanghai2',
          'shanghai3',
          'shanghai4',
          'shanghai5',
          'shanghai6',
          'shanghai7',
          'shanghai8',
          'shanghai9',
          'shanghai10',
          'shanghai11',
          'shanghai12',
          'shanghai13',
          'shanghai14',
          'shanghai15',
          'shanghai16',
          'shanghai17',
          'shanghai18',
          'shanghaipujiang',
        ],
      },
    ],
  },
  {
    title: 'Shanghai Maglev',
    items: [{ type: 'lines', lines: ['shanghaimaglev'] }],
  },
  {
    title: 'Shanghai Suburban Railway',
    titleImage: 'asia/china/shanghai/ssr.png',
    items: [
      { type: 'lines', lines: ['shanghaiairportlink', 'shanghaijinshan'] },
    ],
  },
  {
    title: 'Songjiang Tram',
    titleImage: 'asia/china/shanghai/songjiangtram.png',
    items: [{ type: 'lines', lines: ['shanghait1', 'shanghait2'] }],
  },
  {
    title: 'Shanghai Airport Authority',
    titleImage: 'asia/china/shanghai/AVINEX.png',
    items: [{ type: 'lines', lines: ['shanghaiapm'] }],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/shanghai',
    apple: '/api/city-icon/shanghai',
  },
  title: 'Shanghai Rail Transit Metro Memory',
  description:
    "How many of Shanghai's metro, maglev, suburban rail and tram stations can you name from memory?",
  openGraph: {
    title: 'Shanghai Rail Transit Metro Memory',
    description:
      "How many of Shanghai's metro, maglev, suburban rail and tram stations can you name from memory?",
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/shanghai',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [120.9, 30.68],
    [122.0, 31.48],
  ],
  maxBounds: [
    [120.3, 30.3],
    [122.6, 31.9],
  ],
  minZoom: 8,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'shanghai',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
