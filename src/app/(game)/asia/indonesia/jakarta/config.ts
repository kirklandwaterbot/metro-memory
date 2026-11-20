import type { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import type { Config, Line, LineGroup } from '@/lib/types'
import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Jakarta MRT',
    titleImage: 'MRT.png',
    items: [
      {
        type: 'lines',
        lines: ['JakartaMRTNorthSouth'],
      },
    ],
  },
  {
    title: 'Jakarta LRT',
    titleImage: 'LRT.png',
    items: [
      {
        type: 'lines',
        lines: ['JakartaLRTSouth'],
      },
    ],
  },
  {
    title: 'Jabodebek LRT',
    titleImage: 'Jabodebek.png',
    items: [
      {
        type: 'lines',
        lines: ['JabodebekLRTBekasi', 'JabodebekLRTCibubur'],
      },
    ],
  },
  {
    title: 'KAI Commuter',
    titleImage: 'KAICommuter.png',
    items: [
      {
        type: 'lines',
        lines: ['KAICommuterSoekarnoHatta'],
      },
    ],
  },
  {
    title: 'InJourney Airports',
    titleImage: 'Injourney.png',
    items: [
      {
        type: 'lines',
        lines: ['SoekarnoHattaAirportSkytrain'],
      },
    ],
  },
  {
    title: 'Ancol Dreamland',
    titleImage: 'Ancol.png',
    items: [
      {
        type: 'lines',
        lines: ['AncolGondola', 'KeretaWisataSatoSato'],
      },
    ],
  },
  // merged: jakarta-krl
  {
    title: "KRL Commuterline",
    items: [
      {
        type: 'lines',
        lines: ['KRLBogor', 'KRLCikarang', 'KRLRangkasbitung', 'KRLTangerang', 'KRLTanjungPriok'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/jakarta',
    apple: '/api/city-icon/jakarta',
  },
  title: 'Jakarta Metro Memory Game',
  description:
    'How many Jakarta MRT, LRT, airport rail, airport people-mover, and Ancol Dreamland stations can you name from memory?',
  openGraph: {
    title: 'Jakarta Metro Memory Game',
    description:
      'How many Jakarta MRT, LRT, airport rail, airport people-mover, and Ancol Dreamland stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/indonesia/jakarta',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clqxldtyh013n01nw6w7ihjll',
  bounds: [
    [106.58, -6.42],
    [107.04, -6.08],
  ],
  maxBounds: [
    [105.58, -7.42],
    [108.04, -5.08],
  ],
  minZoom: 8,
  fadeDuration: 50,
}

export const CITY_NAME = 'jakarta'

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
