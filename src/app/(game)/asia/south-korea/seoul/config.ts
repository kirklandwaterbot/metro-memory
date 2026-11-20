import { Metadata } from 'next'
import type { MapboxOptions } from 'mapbox-gl'
import { Config, Line, LineGroup } from '@/lib/types'


export const LINES: {
  [name: string]: Line
} = {
  SeoulSubway1Hoseon: {
    name: 'Line 1',
    color: '#0D3692',
    backgroundColor: '#002446',
    textColor: '#FFFFFF',
    order: 0,
  },
  SeoulSubway2Hoseon: {
    name: 'Line 2',
    color: '#33A23D',
    backgroundColor: '#004923',
    textColor: '#FFFFFF',
    order: 1,
  },
  SeoulSubway3Hoseon: {
    name: 'Line 3',
    color: '#FE5B10',
    backgroundColor: '#8A2C08',
    textColor: '#FFFFFF',
    order: 2,
  },
  SeoulSubway4Hoseon: {
    name: 'Line 4',
    color: '#32A1C8',
    backgroundColor: '#005169',
    textColor: '#FFFFFF',
    order: 3,
  },
  SeoulSubway5Hoseon: {
    name: 'Line 5',
    color: '#8B50A4',
    backgroundColor: '#513153',
    textColor: '#FFFFFF',
    order: 4,
  },
  SeoulSubway6Hoseon: {
    name: 'Line 6',
    color: '#C55C1D',
    backgroundColor: '#4F2308',
    textColor: '#FFFFFF',
    order: 5,
  },
  SeoulSubway7Hoseon: {
    name: 'Line 7',
    color: '#54640D',
    backgroundColor: '#2E330C',
    textColor: '#FFFFFF',
    order: 6,
  },
  SeoulSubway8Hoseon: {
    name: 'Line 8',
    color: '#F51361',
    backgroundColor: '#721932',
    textColor: '#FFFFFF',
    order: 7,
  },
  SeoulSubway9Hoseon: {
    name: 'Line 9',
    color: '#AA9872',
    backgroundColor: '#473B25',
    textColor: '#FFFFFF',
    order: 8,
  },
  SeoulMTRGyeonggangseon: {
    name: 'Gyeonggang Line',
    color: '#004FA2',
    backgroundColor: '#004367',
    textColor: '#FFFFFF',
    order: 9,
  },
  SeoulMTRGyeongyijungangseon: {
    name: 'Gyeongui–Jungang Line',
    color: '#72C7A6',
    backgroundColor: '#2C7056',
    textColor: '#FFFFFF',
    order: 10,
  },
  SeoulMTRGyeongcunseon: {
    name: 'Gyeongchun Line',
    color: '#0C8E72',
    backgroundColor: '#02483A',
    textColor: '#FFFFFF',
    order: 11,
  },
  SeoulAirportRailroadGonghangceoldo: {
    name: 'AREX',
    color: '#3681b7',
    backgroundColor: '#00364F',
    textColor: '#FFFFFF',
    order: 12,
  },
  SeoulMTRSuinbundangseon: {
    name: 'Suin–Bundang Line',
    color: '#e0a134',
    backgroundColor: '#875004',
    textColor: '#FFFFFF',
    order: 13,
  },
  SeoulMTRSinbundangseon: {
    name: 'Shinbundang Line',
    color: '#DB0029',
    backgroundColor: '#5E0C1A',
    textColor: '#FFFFFF',
    order: 14,
  },
  SeoulIncheonMetroInceon1Hoseon: {
    name: 'Incheon Line 1',
    color: '#6E98BB',
    backgroundColor: '#2F4D65',
    textColor: '#FFFFFF',
    order: 15,
  },
  CM_SeoulIncheonMetro2_inceon2hoseon: {
    name: 'Incheon Line 2',
    color: '#ED8B00',
    backgroundColor: '#764000',
    textColor: '#FFFFFF',
    order: 16,
  },
  CM_SeoulLightRailTransit_gimpogoldeurain: {
    name: 'Gimpo Goldline',
    color: '#ad8605',
    backgroundColor: '#574302',
    textColor: '#FFFFFF',
    order: 17,
  },
  SeoulLightRailTransitSeohaeseon: {
    name: 'Seohae Line',
    color: '#81A914',
    backgroundColor: '#47620F',
    textColor: '#FFFFFF',
    order: 18,
  },
  SeoulLightRailTransitSinrimseon: {
    name: 'Sillim Line',
    color: '#6889ca',
    backgroundColor: '#274171',
    textColor: '#FFFFFF',
    order: 19,
  },
  SeoulLightRailTransitEverline: {
    name: 'Yongin EverLine',
    color: '#4EA346',
    backgroundColor: '#285011',
    textColor: '#FFFFFF',
    order: 20,
  },
  SeoulLightRailTransitUisinseolgyeongjeonceol: {
    name: 'Ui–Sinseol Line',
    color: '#b7c452',
    backgroundColor: '#606823',
    textColor: '#FFFFFF',
    order: 21,
  },
  SeoulLightRailTransitUijeongbu: {
    name: 'Uijeongbu LRT',
    color: '#FDA600',
    backgroundColor: '#7F5400',
    textColor: '#FFFFFF',
    order: 22,
  },
}

export const LINE_GROUPS: LineGroup[] = [
  {
    title: 'Seoul Metropolitan Subway',
    items: [
      {
        type: 'lines',
        lines: ['SeoulSubway1Hoseon', 'SeoulSubway2Hoseon', 'SeoulSubway3Hoseon', 'SeoulSubway4Hoseon', 'SeoulSubway5Hoseon', 'SeoulSubway6Hoseon', 'SeoulSubway7Hoseon', 'SeoulSubway8Hoseon', 'SeoulSubway9Hoseon', 'SeoulMTRGyeonggangseon', 'SeoulMTRGyeongyijungangseon', 'SeoulMTRGyeongcunseon', 'SeoulAirportRailroadGonghangceoldo', 'SeoulMTRSuinbundangseon', 'SeoulMTRSinbundangseon', 'SeoulIncheonMetroInceon1Hoseon', 'CM_SeoulIncheonMetro2_inceon2hoseon', 'CM_SeoulLightRailTransit_gimpogoldeurain', 'SeoulLightRailTransitSeohaeseon', 'SeoulLightRailTransitSinrimseon', 'SeoulLightRailTransitEverline', 'SeoulLightRailTransitUisinseolgyeongjeonceol', 'SeoulLightRailTransitUijeongbu'],
      },
    ],
  },
]

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/seoul',
    apple: '/api/city-icon/seoul',
  },
  title: 'Seoul Metro Memory',
  description: 'How many Seoul Metropolitan Subway stations can you name from memory?',
  openGraph: {
    title: 'Seoul Metro Memory',
    description: 'How many Seoul Metropolitan Subway stations can you name from memory?',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://metro-memory.xyz/asia/south-korea/seoul',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clox61b80011o01qofw8s8hdv',
  bounds: [
    [126.764, 37.413],
    [127.191, 37.715],
  ],
  maxBounds: [
    [125.5, 36.5],
    [128.5, 38.5],
  ],
  minZoom: 6,
  fadeDuration: 50,
}


export const CITY_NAME = 'seoul'

export const LOCALE = 'ko'

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
