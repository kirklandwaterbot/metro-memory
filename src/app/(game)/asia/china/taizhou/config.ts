import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const LINES: Record<string, Line> = {
  taizhous1: {
    name: 'S1',
    color: '#0061AE',
    backgroundColor: '#004B86',
    textColor: '#ffffff',
    order: 1,
    icon: 'taizhous1.png',
  },
}

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Taizhou Rail Transit',
    titleImage: 'asia/china/taizhou/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['taizhous1'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/taizhou',
    apple: '/api/city-icon/taizhou',
  },
  title: 'Taizhou Rail Transit Metro Memory Game',
  description: 'How many of the Taizhou Rail Transit stations can you name from memory?',
  openGraph: {
    title: 'Taizhou Rail Transit Metro Memory Game',
    description: 'How many of the Taizhou Rail Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/taizhou',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clo61jvsw003b01pb6rta5qln',
  bounds: [
    [121.3, 28.29],
    [121.44, 28.69],
  ],
  maxBounds: [
    [121.15, 28.15],
    [121.6, 28.83],
  ],
  minZoom: 10,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'taizhou',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
