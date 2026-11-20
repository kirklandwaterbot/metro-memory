import type { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import type { Config, Line, LineGroup } from '@/lib/types'
import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Rapid KL',
    titleImage: 'rapidkl.png',
    items: [
      {
        type: 'lines',
        lines: [
          'KualaLumpurLRTAmpang',
          'KualaLumpurLRTSriPetaling',
          'KualaLumpurLRTKelanaJaya',
          'KualaLumpurKLMonorail',
          'KualaLumpurMRTKajang',
          'KualaLumpurMRTPutrajaya',
          'KualaLumpurLRTShahAlam',
        ],
      },
    ],
  },
  {
    title: 'Express Rail Link',
    titleImage: 'erl.png',
    items: [
      {
        type: 'lines',
        lines: ['KualaLumpurERLKliaEkspres', 'KualaLumpurERLKliaTransit'],
      },
    ],
  },
  {
    title: 'Kuala Lumpur International Airport',
    titleImage: 'KLIA.png',
    items: [
      {
        type: 'lines',
        lines: ['KualaLumpurKLIAAerotrain'],
      },
    ],
  },
  // merged: kl-komuter
  {
    title: "KTM Komuter",
    items: [
      {
        type: 'lines',
        lines: ['KualaLumpurKTMSeremban', 'KualaLumpurKTMPortKlang', 'KualaLumpurKTMSkypark'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/kuala-lumpur',
    apple: '/api/city-icon/kuala-lumpur',
  },
  title: 'Kuala Lumpur Metro Memory Game',
  description:
    'How many Kuala Lumpur LRT, MRT, Monorail, ERL, and airport people-mover stations can you name from memory?',
  openGraph: {
    title: 'Kuala Lumpur Metro Memory Game',
    description:
      'How many Kuala Lumpur LRT, MRT, Monorail, ERL, and airport people-mover stations can you name from memory?',
    type: 'website',
    locale: 'en_GB',
    url: 'https://metro-memory.xyz/asia/malaysia/kuala-lumpur',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clqxldtyh013n01nw6w7ihjll',
  bounds: [
    [101.4504, 2.7002],
    [101.9152, 3.3743],
  ],
  maxBounds: [
    [100.4504, 1.7002],
    [102.9152, 4.3743],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const CITY_NAME = 'kuala-lumpur'

export const LOCALE = 'en'

export const MAP_FROM_DATA = true

export const GAUGE_COLORS = 'inverted'

const config: Config = {
  GAUGE_COLORS,
  MAP_FROM_DATA,
  LOCALE,
  CITY_NAME,
  LINE_GROUPS,
  MAP_CONFIG,
  METADATA,
  LINES,
}

export default config
