import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'

export const LINES: Record<string, Line> = {
  wenzhous1: {
    name: 'S1',
    color: '#0061AE',
    backgroundColor: '#004B86',
    textColor: '#ffffff',
    order: 1,
    icon: 'wenzhous1.png',
  },
  wenzhous2: {
    name: 'S2',
    color: '#E4002B',
    backgroundColor: '#B00022',
    textColor: '#ffffff',
    order: 2,
    icon: 'wenzhous2.png',
  },
}

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Wenzhou Rail Transit',
    titleImage: 'asia/china/wenzhou/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['wenzhous1', 'wenzhous2'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/wenzhou',
    apple: '/api/city-icon/wenzhou',
  },
  title: 'Wenzhou Rail Transit Metro Memory Game',
  description: 'How many of the Wenzhou Rail Transit stations can you name from memory?',
  openGraph: {
    title: 'Wenzhou Rail Transit Metro Memory Game',
    description:
      'How many of the Wenzhou Rail Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/wenzhou',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clo61jvsw003b01pb6rta5qln',
  bounds: [
    [120.56, 27.75],
    [121.01, 28.14],
  ],
  maxBounds: [
    [120.45, 27.65],
    [121.12, 28.24],
  ],
  minZoom: 9,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'wenzhou',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
