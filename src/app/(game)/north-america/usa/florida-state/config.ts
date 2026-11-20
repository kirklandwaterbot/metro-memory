import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'
import linesData from './data/lines.json'


export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Miami-Dade Transit (MDT)',
    titleImage: 'MDT.png',
    items: [
      {
        type: 'lines',
        title: 'Metrorail',
        titleImage: 'Metrorail.png',
        lines: ['floridaGR', 'floridaOR'],
      },
      {
        type: 'lines',
        title: 'Metromover',
        lines: ['floridaOM', 'floridaBR', 'floridaIN'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Miami-Dade Aviation Department (MDAD)',
    titleImage: 'MIA.png',
    items: [
      {
        type: 'lines',
        lines: ['floridaSKYTRAIN'],
      },
      {
        type: 'lines',
        lines: ['floridaMET'],
      },
      {
        type: 'lines',
        lines: ['floridaMIA'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'South Florida Regional Transportation Authority (SFRTA)',
    titleImage: 'SFRTA.png',
    items: [
      {
        type: 'lines',
        lines: ['Tri-Rail'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Brightline',
    titleImage: 'BrightLine.png',
    items: [
      {
        type: 'lines',
        lines: ['brightline'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Central Florida Commuter Rail Commission (CFCRC)',
    items: [
      {
        type: 'lines',
        lines: ['floridaSUN'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Disney Transport',
    titleImage: 'DisneyTransport.png',
    items: [
      {
        type: 'lines',
        title: 'Walt Disney World Railroad',
        lines: ['DisneyDRR'],
      },
      {
        type: 'lines',
        title: 'Disneyland Monorail',
        lines: ['DisneyMKR', 'DisneyMKX', 'DisneyEPC'],
      },
      {
        type: 'lines',
        title: 'Disney Skyliner',
        titleImage: 'DisneySkyliner.png',
        lines: ['DisneySKYEPC', 'DisneySKYHS', 'DisneySKYPOP'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Greater Orlando Aviation Authority (GOAA)',
    titleImage: 'GOAA.png',
    items: [
      {
        type: 'lines',
        title: 'Gate Links',
        lines: ['floridaAS1', 'floridaAS2', 'floridaAS3', 'floridaAS4'],
      },
      {
        type: 'lines',
        title: 'Terminal Link',
        lines: ['floridaTL'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Hillsborough County Aviation Authority (HCAA)',
    titleImage: 'HCAA.png',
    items: [
      {
        type: 'lines',
        title: 'Airside Shuttles',
        lines: ['floridaASA', 'floridaASC', 'floridaASE', 'floridaASF'],
      },
      {
        type: 'lines',
        title: 'SkyConnect',
        lines: ['floridaSKYCONNECT'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Hillsborough Area Regional Transit (HART)',
    titleImage: 'HART.png',
    items: [
      {
        type: 'lines',
        lines: ['floridaTECO'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/florida-state',
    apple: '/api/city-icon/florida-state',
  },
  title: 'Florida State Metro Memory',
  description: 'How many stations across Florida can you name from memory?',
  openGraph: {
    title: 'Florida State Metro Memory',
    description: 'How many stations across Florida can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/north-america/usa/florida-state',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [-89, 23],
    [-77, 33],
  ],
  maxBounds: [
    [-91, 22],
    [-75, 34],
  ],
  minZoom: 3,
  maxZoom: 18,
  fadeDuration: 50,
}


export const CITY_NAME = 'florida-state'

export const LOCALE = 'en'

export const MAP_FROM_DATA = true

export const GAUGE_COLORS = 'inverted'

const config: Config = {
  MAP_FROM_DATA,
  GAUGE_COLORS,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
