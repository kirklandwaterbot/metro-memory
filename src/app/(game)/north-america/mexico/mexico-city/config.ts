import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'


export const LINES: {
  [name: string]: Line
} = {
  DFMetro1: {
    name: 'Line 1',
    color: '#f94f8e',
    backgroundColor: '#9F053E',
    textColor: '#FFFFFF',
    order: 0,
  },
  DFMetro2: {
    name: 'Line 2',
    color: '#0071c1',
    backgroundColor: '#003961',
    textColor: '#FFFFFF',
    order: 1,
  },
  DFMetro3: {
    name: 'Line 3',
    color: '#ad9b0c',
    backgroundColor: '#574E06',
    textColor: '#FFFFFF',
    order: 2,
  },
  DFMetro4: {
    name: 'Line 4',
    color: '#7fbcaa',
    backgroundColor: '#366759',
    textColor: '#FFFFFF',
    order: 3,
  },
  DFMetro5: {
    name: 'Line 5',
    color: '#f9d616',
    backgroundColor: '#847003',
    textColor: '#FFFFFF',
    order: 4,
  },
  DFMetro6: {
    name: 'Line 6',
    color: '#d81e05',
    backgroundColor: '#6C0F03',
    textColor: '#FFFFFF',
    order: 5,
  },
  DFMetro7: {
    name: 'Line 7',
    color: '#e87511',
    backgroundColor: '#743B08',
    textColor: '#FFFFFF',
    order: 6,
  },
  DFMetro8: {
    name: 'Line 8',
    color: '#118749',
    backgroundColor: '#084425',
    textColor: '#FFFFFF',
    order: 7,
  },
  DFMetro9: {
    name: 'Line 9',
    color: '#512826',
    backgroundColor: '#291413',
    textColor: '#FFFFFF',
    order: 8,
  },
  DFMetro12: {
    name: 'Line 12',
    color: '#b99e51',
    backgroundColor: '#5F5026',
    textColor: '#FFFFFF',
    order: 9,
  },
  DFMetroA: {
    name: 'Line A',
    color: '#a02d96',
    backgroundColor: '#50174B',
    textColor: '#FFFFFF',
    order: 10,
  },
  DFMetroB: {
    name: 'Line B',
    color: '#118751',
    backgroundColor: '#084429',
    textColor: '#FFFFFF',
    order: 11,
  },
}

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/mexico-city',
    apple: '/api/city-icon/mexico-city',
  },
  title: 'Mexico City Metro Memory',
  description:
    '¿Cuántas estaciones del metro de Mexico City puedes nombrar de memoria?',
  openGraph: {
    title: 'Mexico City Metro Memory',
    description:
      '¿Cuántas estaciones del metro de Mexico City puedes nombrar de memoria? Prueba este juego para averiguarlo.',
    type: 'website',
    locale: 'es_ES',
    url: 'https://metro-memory.xyz/north-america/mexico/mexico-city',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clp1c5rl601b901qy05alechg',
  bounds: [
    [-99.3267822265625, 19.0797428654523],
    [-98.9117431640625, 19.6146091915543],
  ],
  // +- 1 degree
  maxBounds: [
    [-100.3267822265625, 18.0797428654523],
    [-97.9117431640625, 20.6146091915543],
  ],
  minZoom: 6,
  fadeDuration: 50,
}


export const CITY_NAME = 'mexico-city'

export const LOCALE = 'es'

export const MAP_FROM_DATA = true

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Sistema de Transporte Colectivo (STC Metro)',
    items: [
      {
        type: 'lines',
        lines: [
          'DFMetro1',
          'DFMetro2',
          'DFMetro3',
          'DFMetro4',
          'DFMetro5',
          'DFMetro6',
          'DFMetro7',
          'DFMetro8',
          'DFMetro9',
          'DFMetro12',
          'DFMetroA',
          'DFMetroB',
        ],
      },
    ],
  },
]

const config: Config = {
  MAP_FROM_DATA,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
