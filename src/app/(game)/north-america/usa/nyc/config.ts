import { Config, Line, LineGroup } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'
import linesData from './data/lines.json'


export const LINES = linesData as { [name: string]: Line }

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/nyc',
    apple: '/api/city-icon/nyc',
  },
  title: 'New York Metro Rapid Transit Memory',
  description:
    'How many New York metro rapid transit stations can you name from memory?',
  openGraph: {
    title: 'New York Metro Rapid Transit Memory',
    description:
      'How many New York metro rapid transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/north-america/usa/nyc',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  bounds: [
    [-75.2, 39.3],
    [-71.9, 41.9],
  ],
  maxBounds: [
    [-77, 38.5],
    [-70.5, 43.5],
  ],
  minZoom: 5,
  fadeDuration: 50,
}

export const CITY_NAME = 'nyc'

export const LOCALE = 'en'

export const GAUGE_COLORS = 'inverted'

export const MAP_FROM_DATA = true


export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'New York City Transit Authority (NYCTA)',
    titleImage: 'MTA.png',
    items: [
      {
        type: 'lines',
        title: 'Subway - A Division',
        lines: [
          'NewYorkSubway1',
          'NewYorkSubway2',
          'NewYorkSubway3',
          'NewYorkSubway4',
          'NewYorkSubway5',
          'NewYorkSubway6',
          'NewYorkSubway6X',
          'NewYorkSubway7',
          'NewYorkSubway7X',
          'NewYorkSubwayGS',
        ],
      },
      {
        type: 'lines',
        title: 'Subway - B Division',
        lines: [
          'NewYorkSubwayA',
          'NewYorkSubwayB',
          'NewYorkSubwayC',
          'NewYorkSubwayD',
          'NewYorkSubwayE',
          'NewYorkSubwayF',
          'NewYorkSubwayFX',
          'NewYorkSubwayG',
          'NewYorkSubwayJ',
          'NewYorkSubwayL',
          'NewYorkSubwayM',
          'NewYorkSubwayN',
          'NewYorkSubwayQ',
          'NewYorkSubwayR',
          'NewYorkSubwayW',
          'NewYorkSubwayFS',
          'NewYorkSubwayT',
          'NewYorkSubwayZ',
        ],
      },
      {
        type: 'lines',
        title: 'Interborough Express',
        lines: ['IBX'],
      },
      {
        type: 'lines',
        title: 'Staten Island Railroad',
        lines: ['NewYorkSubwaySI', 'NewYorkSubwaySIExpress'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Roosevelt Island Operating Corporation (RIOC)',
    titleImage: 'RIOC.jpg',
    items: [
      {
        type: 'lines',
        lines: ['RIOCRooseveltIslandTram'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Port Authority of New York and New Jersey (PANYNJ)',
    titleImage: 'PANYNJ.png',
    items: [
      {
        type: 'lines',
        title: 'Port Authority Trans-Hudson (PATH)',
        titleImage: 'PATH.png',
        lines: [
          'NewYorkSubwayPATHHob33',
          'NewYorkSubwayPATHHobwtc',
          'NewYorkSubwayPATHJsq33',
          'NewYorkSubwayPATHNwkwtc',
        ],
      },
      {
        type: 'lines',
        title: 'EWR Airtrain',
        titleImage: 'EWR.png',
        lines: ['AirTrainEWR'],
      },
      {
        type: 'lines',
        title: 'JFK AirTrain',
        titleImage: 'JFK.png',
        lines: [
          'AirTrainJFKHowardBeach',
          'AirTrainJFKJamaica',
          'AirTrainJFKAllTerminals',
        ],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'New Jersey Transit Light Rail (NJTLR)',
    titleImage: 'NJT.png',
    items: [
      {
        type: 'lines',
        title: 'Hudson Bergen Light Rail (HBLR)',
        titleImage: 'HBLR.png',
        lines: [
          'NJTLR8thStHoboken',
          'NJTLRBayonneFlyer',
          'NJTLRWestSideTonnelle',
          'NJTLRHobokenTonnelle',
        ],
      },
      {
        type: 'lines',
        title: 'Newark Light Rail (NLR)',
        titleImage: 'NLR.png',
        lines: ['NJTLRNewark', 'NJTLRNewarkBroad'],
      },
      {
        type: 'lines',
        title: 'River Line',
        titleImage: 'RiverLine.png',
        lines: ['NJTLRRiverLine'],
      },
      {
        type: 'lines',
        title: 'Glassboro-Camden Line',
        lines: ['NJTLRGlassboroCamden'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Long Island Rail Road (LIRR)',
    titleImage: 'MTA.png',
    items: [
      {
        type: 'lines',
        title: 'Electric',
        lines: [
          'LIRRAtlantic',
          'LIRRBabylon',
          'LIRRBelmont',
          'LIRRFarRockaway',
          'LIRRHempstead',
          'LIRRLongBeach',
          'LIRRPortWashington',
          'LIRRRonkonkoma',
          'LIRRWestHempstead',
        ],
      },
      {
        type: 'lines',
        title: 'Diesel',
        lines: [
          'LIRRGreenport',
          'LIRRMontauk',
          'LIRROysterBay',
          'LIRRPortJefferson',
        ],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Metro-North Railroad (MNR)',
    titleImage: 'MTA.png',
    items: [
      {
        type: 'lines',
        title: 'East of Hudson - Hudson & Harlem',
        lines: ['MNRRHarlem', 'MNRRHudson'],
      },
      {
        type: 'lines',
        title: 'East of Hudson - New Haven',
        lines: [
          'MNRRDanbury',
          'MNRRNewCanaan',
          'MNRRNewHaven',
          'MNRRWaterbury',
        ],
      },
      {
        type: 'lines',
        title: 'West of Hudson',
        lines: ['NJTPascackValley', 'NJTPortJervis'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'New Jersey Transit Rail (NJTR)',
    titleImage: 'NJT.png',
    items: [
      {
        type: 'lines',
        title: 'Newark Division',
        lines: [
          'NJTAtlanticCity',
          'NJTNorthJerseyCoast',
          'NJTNorthEastCorridor',
          'NJTPrinceton',
          'NJTRaritanValley',
        ],
      },
      {
        type: 'lines',
        title: 'Hoboken Division',
        lines: [
          'NJTBergenCounty',
          'NJTGladstone',
          'NJTMainLine',
          'NJTMeadowlands',
          'NJTMontclairBoonton',
          'NJTMorrisEssex',
          'NJTPascackValley',
          'NJTPortJervis',
          'NJTLackawannaCutOff',
        ],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'CTrail',
    titleImage: 'CTrail.png',
    items: [
      {
        type: 'lines',
        lines: ['CTRailHartfordLine', 'CTRailShoreLineEast'],
      },
    ],
  },
  {
    items: [{ type: 'separator' }],
  },
  {
    title: 'Amtrak',
    titleImage: 'Amtrak.png',
    items: [
      {
        type: 'lines',
        lines: ['Amtrak'],
      },
    ],
  },
]

const config: Config = {
  GAUGE_COLORS,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  LINE_GROUPS,
  MAP_FROM_DATA,
}

export default config
