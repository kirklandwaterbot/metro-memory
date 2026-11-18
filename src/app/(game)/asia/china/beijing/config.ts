import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

import linesData from './data/lines.json'

export const LINES = linesData as { [name: string]: Line }

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Beijing Mass Transit Railway Operation Corp., Ltd.',
    titleImage: 'asia/china/beijing/beijingsubway.png',
    items: [
      {
        type: 'lines',
        lines: [
          'beijing1',
          'beijingbatong',
          'beijing2',
          'beijing3',
          'beijing5',
          'beijing6',
          'beijing7',
          'beijing8',
          'beijing9',
          'beijing10',
          'beijing11',
          'beijing12',
          'beijing13',
          'beijing15',
          'beijing18',
          'beijing19',
          'beijingyizhuang',
          'beijingfangshan',
          'beijingyanfang',
          'beijings1',
          'beijingchangping',
        ],
      },
    ],
  },
  {
    title: 'Beijing Mass Transit Railway Corp., Ltd. (BJMTR)',
    titleImage: 'asia/china/beijing/beijingMTR.png',
    items: [
      {
        type: 'lines',
        lines: ['beijing4', 'beijingdaxing', 'beijing14', 'beijing16', 'beijing17'],
      },
    ],
  },
  {
    title: 'Beijing Metro Operation Administration (BJMOA) Corp., Ltd.',
    titleImage: 'asia/china/beijing/bjmoa.png',
    items: [
      {
        type: 'lines',
        lines: ['beijingyanfang', 'beijingdae'],
      },
    ],
  },
  {
    title: 'Beijing Capital Metro Corp., Ltd.',
    titleImage: 'asia/china/beijing/capitalmetro.png',
    items: [
      {
        type: 'lines',
        lines: ['beijingcae'],
      },
    ],
  },
  {
    title: 'Beijing Public Transit Tramway Co., Ltd.',
    titleImage: 'asia/china/beijing/BeijingPT.png',
    items: [
      {
        type: 'lines',
        lines: ['beijingxijiao', 'beijingyizhuangt1'],
      },
    ],
  },
  {
    title: 'Beijing Suburban Railway (BCR)',
    titleImage: 'asia/china/beijing/BCR.png',
    items: [
      {
        type: 'lines',
        lines: ['beijingsubcenter', 'beijings2', 'beijinghuairou', 'beijingtongmi'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/beijing',
    apple: '/api/city-icon/beijing',
  },
  title: 'Beijing Rail Transit Metro Memory',
  description: "How many of Beijing's rail transit stations can you name from memory?",
  openGraph: {
    title: 'Beijing Rail Transit Metro Memory',
    description: "How many of Beijing's rail transit stations can you name from memory?",
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/beijing',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls31ijdo010o01plcpzag11d',
  bounds: [
    [115.4, 39.35],
    [117.65, 41.05],
  ],
  maxBounds: [
    [114.8, 39.0],
    [118.1, 41.5],
  ],
  minZoom: 7.5,
  fadeDuration: 50,
}

const config: Config = {
  MAP_FROM_DATA: true,
  LOCALE: 'en',
  CITY_NAME: 'beijing',
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
}

export default config
