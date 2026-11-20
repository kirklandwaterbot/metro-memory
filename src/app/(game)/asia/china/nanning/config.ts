import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const LINES: Record<string, Line> = {
  nanning1: {
    name: 'Line 1',
    color: '#00B04F',
    backgroundColor: '#00843d',
    textColor: '#ffffff',
    order: 1,
    icon: 'nanning1.png',
  },
  nanning2: {
    name: 'Line 2',
    color: '#EB3D1A',
    backgroundColor: '#b42f14',
    textColor: '#ffffff',
    order: 2,
    icon: 'nanning2.png',
  },
  nanning3: {
    name: 'Line 3',
    color: '#571887',
    backgroundColor: '#3e1062',
    textColor: '#ffffff',
    order: 3,
    icon: 'nanning3.png',
  },
  nanning4: {
    name: 'Line 4',
    color: '#DAE600',
    backgroundColor: '#a8b100',
    textColor: '#000000',
    order: 4,
    icon: 'nanning4.png',
  },
  nanning5: {
    name: 'Line 5',
    color: '#0057A3',
    backgroundColor: '#003f74',
    textColor: '#ffffff',
    order: 5,
    icon: 'nanning5.png',
  },
  nanning6: {
    name: 'Line 6',
    color: '#F68306',
    backgroundColor: '#b85e00',
    textColor: '#ffffff',
    order: 6,
    icon: 'nanning6.png',
  },
}

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Nanning Rail Transit (NNRT)',
    titleImage: 'asia/china/nanning/icon.ico',
    items: [
      {
        type: 'lines',
        lines: ['nanning1', 'nanning2', 'nanning3', 'nanning4', 'nanning5', 'nanning6'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/nanning',
    apple: '/api/city-icon/nanning',
  },
  title: 'Nanning Rail Transit Metro Memory Game',
  description: 'How many of the Nanning Rail Transit stations can you name from memory?',
  openGraph: {
    title: 'Nanning Rail Transit Metro Memory Game',
    description: 'How many of the Nanning Rail Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/nanning',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clo61jvsw003b01pb6rta5qln',
  bounds: [
    [108.153, 22.702],
    [108.481, 22.912],
  ],
  maxBounds: [
    [108.05, 22.6],
    [108.6, 23.05],
  ],
  minZoom: 9,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'nanning',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
