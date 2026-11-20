import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const LINES: Record<string, Line> = {
  xiamen1: {
    name: 'Line 1',
    color: '#ff7300',
    backgroundColor: '#b35200',
    textColor: '#000000',
    order: 1,
    icon: 'xiamen1.png',
  },
  xiamen2: {
    name: 'Line 2',
    color: '#008900',
    backgroundColor: '#006200',
    textColor: '#ffffff',
    order: 2,
    icon: 'xiamen2.png',
  },
  xiamen3: {
    name: 'Line 3',
    color: '#529fc9',
    backgroundColor: '#39789b',
    textColor: '#ffffff',
    order: 3,
    icon: 'xiamen3.png',
  },
  xiamen4: {
    name: 'Line 4',
    color: '#fe5466',
    backgroundColor: '#c53c4b',
    textColor: '#ffffff',
    order: 4,
    icon: 'xiamen4.png',
  },
}

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Xiamen Metro',
    titleImage: 'asia/china/xiamen/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['xiamen1', 'xiamen2', 'xiamen3', 'xiamen4'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/xiamen',
    apple: '/api/city-icon/xiamen',
  },
  title: 'Xiamen Metro Memory Game',
  description: 'How many Xiamen Metro stations can you name from memory?',
  openGraph: {
    title: 'Xiamen Metro Memory Game',
    description: 'How many Xiamen Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/xiamen',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clo61jvsw003b01pb6rta5qln',
  bounds: [
    [117.9099, 24.4229],
    [118.3794, 24.6569],
  ],
  maxBounds: [
    [117.85, 24.35],
    [118.45, 24.72],
  ],
  minZoom: 9.5,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'xiamen',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
