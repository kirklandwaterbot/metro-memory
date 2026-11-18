import { Config, Line } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'


export const LINES: {
  [name: string]: Line
} = {
  Bakerloo: {
    name: 'Bakerloo',
    color: '#b36305',
    backgroundColor: '#5e2f00',
    textColor: '#fff',
    order: 0,
  },

  Central: {
    name: 'Central',
    color: '#e32017',
    backgroundColor: '#7f0f00',
    textColor: '#fff',
    order: 1,
  },

  Circle: {
    name: 'Circle',
    color: '#ffd329',
    backgroundColor: '#7f6d00',
    textColor: '#222',
    order: 2,
  },
  District: {
    name: 'District',
    color: '#00782a',
    backgroundColor: '#00441b',
    textColor: '#fff',
    order: 4,
  },
  HammersmithAndCity: {
    name: 'Hammersmith & City',
    color: '#f3a9bb',
    backgroundColor: '#b41f43',
    textColor: '#222',
    order: 6,
  },
  Jubilee: {
    name: 'Jubilee',
    color: '#a0a5a9',
    backgroundColor: '#4c4f52',
    textColor: '#fff',
    order: 7,
  },
  Metropolitan: {
    name: 'Metropolitan',
    color: '#9b0056',
    backgroundColor: '#4f002d',
    textColor: '#fff',
    order: 8,
  },
  Northern: {
    name: 'Northern',
    color: '#000000',
    backgroundColor: '#444',
    textColor: '#fff',
    order: 9,
  },
  Piccadilly: {
    name: 'Piccadilly',
    color: '#003688',
    backgroundColor: '#001e62',
    textColor: '#fff',
    order: 11,
  },
  Victoria: {
    name: 'Victoria',
    color: '#0098d4',
    backgroundColor: '#005785',
    textColor: '#fff',
    order: 12,
  },
  WaterlooAndCity: {
    name: 'Waterloo & City',
    color: '#84CAB3',
    backgroundColor: '#005b44',
    textColor: '#222',
    order: 13,
  },
  DLR: {
    name: 'DLR',
    color: '#00afad',
    backgroundColor: '#006d6b',
    textColor: '#fff',
    order: 14,
  },
  Liberty: {
    name: 'Liberty',
    color: '#61686B',
    backgroundColor: '#2f3335',
    textColor: '#fff',
    order: 15,
  },
  Lioness: {
    name: 'Lioness',
    color: '#FFA600',
    backgroundColor: '#7a4f00',
    textColor: '#222',
    order: 16,
  },
  Mildmay: {
    name: 'Mildmay',
    color: '#006FE6',
    backgroundColor: '#003670',
    textColor: '#fff',
    order: 17,
  },
  Suffragette: {
    name: 'Suffragette',
    color: '#18A95D',
    backgroundColor: '#0b502c',
    textColor: '#fff',
    order: 18,
  },
  Weaver: {
    name: 'Weaver',
    color: '#9B0058',
    backgroundColor: '#4b002a',
    textColor: '#fff',
    order: 19,
  },
  Windrush: {
    name: 'Windrush',
    color: '#DC241F',
    backgroundColor: '#6b110f',
    textColor: '#fff',
    order: 20,
  },
  ElizabethLine: {
    name: 'Elizabeth Line',
    color: '#6950A1',
    backgroundColor: '#2b1d4d',
    textColor: '#fff',
    order: 21,
  },
}

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/london',
    apple: '/api/city-icon/london',
  },
  title: 'London Tube Memory Game',
  description: 'How many of the London Tube stations can you name from memory?',
  openGraph: {
    title: 'London Tube Memory Game',
    description:
      'How many of the London Tube stations can you name from memory?',
    type: 'website',
    locale: 'en_GB',
    url: 'https://metro-memory.xyz/europe/uk/london',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clnx0tw77005n01qsfyeya61u',
  bounds: [
    [-0.619997, 51.323273],
    [0.35504, 51.68869],
  ],
  maxBounds: [
    [-2.058488, 50.738554],
    [1.841659, 52.201223],
  ],
  minZoom: 6,
  fadeDuration: 50,
}


export const CITY_NAME = 'london'

export const LOCALE = 'en'

export const GAUGE_COLORS = 'inverted'

export const MAP_FROM_DATA = true

const config: Config = {
  GAUGE_COLORS,
  MAP_FROM_DATA: true,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
}

export default config
