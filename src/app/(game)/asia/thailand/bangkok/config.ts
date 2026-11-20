import type { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import type { Config, Line, LineGroup } from '@/lib/types'
import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Metropolitan Rapid Transit (MRT)',
    titleImage: 'MRT.png',
    items: [
      {
        type: 'lines',
        title: 'Light Metro',
        lines: ['BangkokMRTBlue', 'BangkokMRTPurple'],
      },
      {
        type: 'lines',
        title: 'Monorail',
        lines: ['BangkokMRTYellow', 'BangkokMRTPink'],
      },
    ],
  },
  {
    title: 'Bangkok Mass Transit System (BTS Skytrain)',
    titleImage: 'BTS.png',
    items: [
      {
        type: 'lines',
        title: 'Rapid Transit',
        lines: ['BangkokBTSSukhumvit', 'BangkokBTSSilom'],
      },
      {
        type: 'lines',
        title: 'Automated People Mover',
        lines: ['BangkokBTSGold'],
      },
    ],
  },
  {
    title: 'Airport Rail Link (ARL)',
    titleImage: 'AirportRailLink.png',
    items: [
      {
        type: 'lines',
        lines: ['BangkokARL'],
      },
    ],
  },
  {
    title: 'Suvarnabhumi Airport',
    titleImage: 'AirportAPM.png',
    items: [
      {
        type: 'lines',
        lines: ['BangkokAirportAPM'],
      },
    ],
  },
  {
    title: 'Red Line Mass Transit System Project (SRT Red Lines)',
    titleImage: 'SRT.png',
    items: [
      {
        type: 'lines',
        lines: ['BangkokSRTDarkRed', 'BangkokSRTLightRed'],
      },
    ],
  },
  // merged: bkk-srt
  {
    title: "SRT Commuter Rail",
    items: [
      {
        type: 'lines',
        lines: ['BangkokSRTLopburi', 'BangkokSRTKaengKhoi', 'BangkokSRTPrachinburi', 'BangkokSRTRatchaburi', 'BangkokSRTSuphanburi'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/bangkok',
    apple: '/api/city-icon/bangkok',
  },
  title: 'Bangkok Metro Memory Game',
  description:
    'How many Bangkok MRT, BTS, Airport Rail Link, airport people-mover, and SRT Red Line stations can you name from memory?',
  openGraph: {
    title: 'Bangkok Metro Memory Game',
    description:
      'How many Bangkok MRT, BTS, Airport Rail Link, airport people-mover, and SRT Red Line stations can you name from memory?',
    type: 'website',
    locale: 'en_GB',
    url: 'https://metro-memory.xyz/asia/thailand/bangkok',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clqxldtyh013n01nw6w7ihjll',
  bounds: [
    [100.29488248145446, 13.532439382980366],
    [100.96229065947798, 14.130362877670975],
  ],
  maxBounds: [
    [99.29488248145446, 12.532439382980366],
    [101.96229065947798, 15.130362877670975],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const CITY_NAME = 'bangkok'

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
