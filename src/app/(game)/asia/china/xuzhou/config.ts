import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const LINES: Record<string, Line> = {
  xuzhou1: {
    name: 'Line 1',
    color: '#A23337',
    backgroundColor: '#7a252a',
    textColor: '#ffffff',
    order: 1,
    icon: 'xuzhou1.png',
  },
  xuzhou2: {
    name: 'Line 2',
    color: '#EF8302',
    backgroundColor: '#b56200',
    textColor: '#ffffff',
    order: 2,
    icon: 'xuzhou2.png',
  },
  xuzhou3: {
    name: 'Line 3',
    color: '#008BD5',
    backgroundColor: '#006da8',
    textColor: '#ffffff',
    order: 3,
    icon: 'xuzhou3.png',
  },
  xuzhou4: {
    name: 'Line 4',
    color: '#6FB92C',
    backgroundColor: '#4f8a20',
    textColor: '#ffffff',
    order: 4,
    icon: 'xuzhou4.png',
  },
  xuzhou6: {
    name: 'Line 6',
    color: '#541F7F',
    backgroundColor: '#3d165d',
    textColor: '#ffffff',
    order: 5,
    icon: 'xuzhou6.png',
  },
}

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Xuzhou Metro',
    titleImage: 'asia/china/xuzhou/xuzhoumetro.png',
    items: [
      {
        type: 'lines',
        lines: ['xuzhou1', 'xuzhou2', 'xuzhou3', 'xuzhou4', 'xuzhou6'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/xuzhou',
    apple: '/api/city-icon/xuzhou',
  },
  title: 'Xuzhou Metro Memory Game',
  description: 'How many Xuzhou Metro stations can you name from memory?',
  openGraph: {
    title: 'Xuzhou Metro Memory Game',
    description: 'How many Xuzhou Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/xuzhou',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clo61jvsw003b01pb6rta5qln',
  bounds: [
    [117.0, 34.12],
    [117.36, 34.36],
  ],
  maxBounds: [
    [116.95, 34.05],
    [117.45, 34.42],
  ],
  minZoom: 10,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'xuzhou',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
