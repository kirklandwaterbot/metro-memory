'use client'

import { MdClose } from 'react-icons/md'
import AccountDashboard from '@/app/(website)/account/panel'
import AchievementToast from '@/components/AchievementToast'
import AdSlot from '@/components/ads/AdSlot'
import CityStatsPanel from '@/components/CityStatsPanel'
import CloseButton from '@/components/CloseButton'
import FoundList from '@/components/FoundList'
import FoundSummary from '@/components/FoundSummary'
import Input from '@/components/Input'
import IntroModal from '@/components/IntroModal'
import LineBadge from '@/components/LineBadge'
import MenuComponent from '@/components/Menu'
import MiniCityLinksPanel from '@/components/MiniCityLinksPanel'
import CustomGameModal from '@/components/CustomGameModal'
import CustomLayoutsPanel from '@/components/CustomLayoutsPanel'
import MissedGuessInputsModal from '@/components/MissedGuessInputsModal'
import PrivacyPanel from '@/components/PrivacyPanel'
import SettingsPanel from '@/components/SettingsPanel'
import ThemeToggleButton from '@/components/ThemeToggleButton'
import ToolbarPopoverButton from '@/components/ToolbarPopoverButton'

import ZenModeToast from '@/components/ZenModeToast'
import { useAuth } from '@/context/AuthContext'
import { KeybindingAction, useSettings } from '@/context/SettingsContext'
import useHideLabels from '@/hooks/useHideLabels'
import useNormalizeString from '@/hooks/useNormalizeString'
import { useShouldShowAds } from '@/hooks/useShouldShowAds'
import useTranslation from '@/hooks/useTranslation'
import { getAchievementForCity } from '@/lib/achievements'
import { transformFeatureCollectionForAmapCached } from '@/lib/amapCoordinateTransform'
import { appConfig } from '@/lib/appConfig'
import { NEAR_BLACK_DARK_MODE_COLOR, isColorNearBlack } from '@/lib/colorUtils'
import { useConfig } from '@/lib/configContext'
import {
    formatLocalizedChinaUiDescription,
    formatLocalizedChinaUiTitle,
} from '@/lib/chinaUiText'
import { buildChinaSafeMapStyle, buildOfflineMapStyle } from '@/lib/chinaSafeMapStyle'
import { formatLocalizedCityName } from '@/lib/cityNameDisplay'
import { formatLocalizedLineName } from '@/lib/lineNameDisplay'
import { getCityStationAliases } from '@/lib/cityStationAliases'
import { generateChineseDirectionalAlternates } from '@/lib/chineseDirectionalAliases'
import {
    extractChineseStationNameContext,
    normalizeChineseStationDisplayName,
} from '@/lib/chineseStationNameNormalization'
import {
    generateChineseStreetAlternates,
    generateContextualChineseStreetAlternates,
} from '@/lib/chineseStreetAliases'
import { getKeystrokeFromEvent } from '@/lib/keyboardUtils'
import { rememberLastPlayedCity } from '@/lib/lastPlayedCities'
import { generateOrdinalNumberAlternates } from '@/lib/normalizeStationString'
import {
    featureMatchesManualComplexSelector,
    repairManualComplexGroups,
    type ManualComplexSelector,
} from '@/lib/manualComplexes'
import { disableMapboxTelemetry } from '@/lib/mapboxTelemetry'
import { configureMapboxRuntime } from '@/lib/mapboxRuntime'
import { loadMiniCityStationIdSet } from '@/lib/miniCityProgress'
import { getMiniCityLinksForSlug, isMiniCitySlug } from '@/lib/miniCities'
import { parseCustomLayout, type CustomLayout } from '@/lib/customLayouts'
import {
    clearLocalProgressRecord,
    fetchRemoteProgress,
    readLocalProgress,
    syncDirtyProgressFromStorage,
    syncProgressRecords,
    writeLocalProgress,
} from '@/lib/progressRepository'
import { downloadCityForOffline, isCityDownloaded } from '@/lib/offlineCityManager'
import { repairMojibakeArray, repairMojibakeString } from '@/lib/repairMojibake'
import {
    clearAutoRevealSuppressionForCity,
    readSolutionsAccess,
    shouldAutoRevealSolutions,
    suppressAutoRevealForCity,
    writeSolutionsAccess,
} from '@/lib/solutionsAccess'
import {
    autoClusterAliasSetsOverlap,
    buildAutoClusterAliases,
} from '@/lib/stationComplexes'
import { generateStationlessAlternates } from '@/lib/stationlessAliases'
import { formatLocalizedStationDisplayName } from '@/lib/stationNameDisplay'
import { getStationKey } from '@/lib/stationUtils'
import { generateUniversityStationAlternates } from '@/lib/universityStationAliases'
import {
    DataFeature,
    DataFeatureCollection,
    RoutesFeatureCollection,
} from '@/lib/types'
import { useLocalStorageValue } from '@react-hookz/web'
import { coordEach } from '@turf/meta'
import { bbox } from '@turf/turf'
import Fuse from 'fuse.js'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  MdDownload,
  MdDownloadDone,
  MdDownloading,
  MdDashboardCustomize,
  MdErrorOutline,
  MdGridView,
  MdLayers,
  MdMap,
  MdRestartAlt,
  MdShare,
} from 'react-icons/md'
import {
    CSSProperties,
    ChangeEvent,
    ComponentPropsWithoutRef,
    FormEvent,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import 'react-circular-progressbar/dist/styles.css'

function SidebarArrowUpIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 19.5v-15m0 0L5.25 11.25M12 4.5l6.75 6.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ControlHoverLabel({
  children,
}: {
  children: string
}) {
  return (
    <span className="pointer-events-none hidden max-w-0 shrink-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100 lg:inline-block">
      {children}
    </span>
  )
}

const CONNECTOR_CONFIG = [
  { delimiter: ' - ', joiner: ' - ' },
  { delimiter: ' / ', joiner: ' / ' },
  { delimiter: ' & ', joiner: ' & ' },
]

const ACHIEVEMENT_COMPLETION_THRESHOLD = 0.9999
const INLINE_AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE

type StoredMapView = {
  zoom: number
  center: [number, number]
}

const isStoredMapView = (value: unknown): value is StoredMapView => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as { zoom?: unknown; center?: unknown }
  return (
    typeof candidate.zoom === 'number' &&
    Number.isFinite(candidate.zoom) &&
    Array.isArray(candidate.center) &&
    candidate.center.length === 2 &&
    candidate.center.every((coordinate) =>
      typeof coordinate === 'number' && Number.isFinite(coordinate),
    )
  )
}

const getStoredMapViewFromMap = (map: mapboxgl.Map): StoredMapView | null => {
  try {
    const center = map.getCenter()
    const view = {
      zoom: map.getZoom(),
      center: [center.lng, center.lat] as [number, number],
    }

    return isStoredMapView(view) ? view : null
  } catch {
    return null
  }
}

const safeSetMapLayoutProperty = (
  map: mapboxgl.Map,
  layerId: string,
  property: string,
  value: unknown,
) => {
  try {
    if (!map.getStyle()?.layers || !map.getLayer(layerId)) {
      return
    }

    if (map.getLayoutProperty(layerId, property) !== value) {
      map.setLayoutProperty(layerId, property, value as any)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.toLowerCase().includes('style')) {
      console.warn(`Failed to update map layer "${layerId}"`, error)
    }
  }
}

const mapUnavailableMessage =
  'This browser lost the WebGL map context, so the map cannot be displayed right now. Please reload the page, enable hardware acceleration, or try a different browser.'



type AchievementToastState = {
  slug: string
  cityName: string
  title: string
  description: string
}

type MapCoordsMenuState = {
  x: number
  y: number
  lng: number
  lat: number
}

const achievementToastStorageKey = (slug: string) => `achievement-toast-hidden-${slug}`
const FAVORITES_STORAGE_PREFIX = 'favorites-v1'
const getFavoritesStorageKey = (userId?: string | null) =>
  `${FAVORITES_STORAGE_PREFIX}-${userId || 'anon'}`

const deriveCityDisplayName = (title?: string, fallback?: string) => {
  const repairedTitle = title ? repairMojibakeString(title) : title
  if (!repairedTitle) {
    return fallback ?? ''
  }
  const stripped = repairedTitle
    .replace(/\s*\|\s*.*$/, '')
    .replace(/Metro Memory Game/gi, '')
    .replace(/Metro Memory/gi, '')
    .replace(/\bGame\b/gi, '')
    .trim()
  if (stripped.length > 0) {
    return stripped
  }
  return repairedTitle
}

const extractMetadataTitle = (title: unknown): string | undefined => {
  if (!title) {
    return undefined
  }
  if (typeof title === 'string') {
    return repairMojibakeString(title)
  }
  if (typeof title === 'object') {
    const candidate = title as { absolute?: unknown; default?: unknown }
    if (typeof candidate.absolute === 'string') {
      return repairMojibakeString(candidate.absolute)
    }
    if (typeof candidate.default === 'string') {
      return repairMojibakeString(candidate.default)
    }
  }
  return undefined
}

const EMPTY_TIMESTAMPS: Record<string, string> = {}
const RETURN_SYMBOL = '\u23ce'

const GLOBAL_SATELLITE_STORAGE_KEY = 'global-satellite-enabled'
const GLOBAL_MAP_NAMES_STORAGE_KEY = 'global-map-names-enabled'
const getMapStyleModeStorageKey = (cityName: string) => `map-style-mode-${cityName}`
const getMapStylePreferenceStorageKey = (cityName: string) =>
  `map-style-preference-${cityName}`
type MapStyleMode = 'default' | 'amap'
const getMapViewStorageKey = (cityName: string, mapStyleMode: MapStyleMode) =>
  mapStyleMode === 'amap' ? `map-view-${cityName}-amap` : `map-view-${cityName}`

type RenderBounds = [number, number, number, number]

const EMPTY_DATA_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
} as DataFeatureCollection

const EMPTY_ROUTES_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
} as RoutesFeatureCollection

const normalizeMapStyleOverride = (style?: string | null) => {
  if (!style) {
    return null
  }

  const trimmed = style.trim()
  if (!trimmed) {
    return null
  }

  if (
    trimmed.includes('/your-account/') ||
    trimmed.endsWith('/light-style') ||
    trimmed.endsWith('/dark-style')
  ) {
    return null
  }

  return trimmed
}

const copyTextToClipboard = async (text: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall back to the legacy copy path below.
    }
  }

  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

const MAP_COORDS_TOAST_DISMISS_MS = 5000
const collectGeometryBounds = (
  coordinates: unknown,
  currentBounds: RenderBounds | null = null,
): RenderBounds | null => {
  if (!Array.isArray(coordinates)) {
    return currentBounds
  }

  if (
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    const [lng, lat] = coordinates as [number, number]
    if (!currentBounds) {
      return [lng, lat, lng, lat]
    }
    return [
      Math.min(currentBounds[0], lng),
      Math.min(currentBounds[1], lat),
      Math.max(currentBounds[2], lng),
      Math.max(currentBounds[3], lat),
    ]
  }

  let nextBounds = currentBounds
  coordinates.forEach((child) => {
    nextBounds = collectGeometryBounds(child, nextBounds)
  })
  return nextBounds
}

const getFeatureBounds = (
  feature: DataFeature | RoutesFeatureCollection['features'][number],
): RenderBounds | null => collectGeometryBounds(feature.geometry?.coordinates)

const expandRenderBounds = (
  bounds: RenderBounds,
  paddingFactor: number,
): RenderBounds => {
  const width = bounds[2] - bounds[0]
  const height = bounds[3] - bounds[1]
  const paddingLng = width * paddingFactor
  const paddingLat = height * paddingFactor
  return [
    bounds[0] - paddingLng,
    bounds[1] - paddingLat,
    bounds[2] + paddingLng,
    bounds[3] + paddingLat,
  ]
}

const intersectsRenderBounds = (
  a: RenderBounds,
  b: RenderBounds,
): boolean => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]

const getMapBoundsTuple = (bounds: mapboxgl.LngLatBounds): RenderBounds => {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return [sw.lng, sw.lat, ne.lng, ne.lat]
}

const repairStringArrayRecord = (record: Record<string, string[]>) =>
  Object.fromEntries(
    Object.entries(record).map(([key, values]) => [
      repairMojibakeString(key),
      repairMojibakeArray(values),
    ]),
  ) as Record<string, string[]>

const MANUAL_ALTERNATE_NAMES: Record<string, string[]> = repairStringArrayRecord({
  '42 St - Port Authority Bus Terminal': [
    'Port Authority Bus Terminal',
    'Port Authority Bus Terminal 42 St',
    '42 St Port Authority Bus Terminal',
    'PABT',
    '42 St PABT',
    'PABT 42 St',
  ],
  'New York Penn Station': [
    'New York Penn',
    'Penn Station',
    'Penn',
    'NYP',
    'NY Penn Station',
    'NY Penn',
  ],
  'Newark Airport': [
    'EWR',
    'Newark Liberty International Airport',
    'Newark Liberty Airport',
    'Newark Liberty Intl Airport',
  ],
  'South Station': ['Boston South Station'],
  'North Station': ['Boston North Station'],
  Airport: [
    'Boston Logan International Airport',
    'Logan Airport',
    'Boston Airport',
  ],
  'Newark Penn Station': ['Newark Penn', 'Newark'],
  'Grand Central - 42 St': ['Grand Central'],
  'Grand Central': ['Grand Central - 42 St'],
  'Bedford Park Blvd - Lehman College': [
    'Bedford Park Blvd',
    'Bedford Pk Blvd',
    'Bedford Pk Blvd - Lehman College',
  ],
  'Bedford Park Blvd': ['Bedford Pk Blvd'],
  'Briarwood': ['Briarwood - Van Wyck Blvd'],
  'Court Sq - 23 St': [
    'Court Sq',
    'Court Sq-23 St',
    'Court Square',
    'Court Square - 23 St',
    'Court Square - 23rd St',
  ],
  'Disneyland Resort (迪士尼)': ['Disneyland', 'Hong Kong Disneyland'],
  'Lexington Av/53 St': [
    'Lex Av/53 St',
    'Lexington Ave/53 St',
    'Lexington Avenue/53rd St',
  ],
  'Lexington Av/63 St': [
    'Lex Av/63 St',
    'Lexington Ave/63 St',
    'Lexington Avenue/63rd St',
    '63 St Lex Av',
  ],
  '5 Av/53 St': ['5 Ave/53 St', '5 Av - 53 St', '5 Avenue/53 Street'],
  'Inwood - 207 St': ['Inwood'],
  'W 125 St': ['125 St'],
  'W 62 St': ['62 St'],
  'Astoria - Ditmars Blvd': ['Astoria'],
  'Queens Plaza': ['Queens Plz'],
  'Sutphin Blvd': ['Sutphin Boulevard'],
  'Parsons Blvd': ['Parsons Boulevard'],
  'Jamaica - 179 St': ['179 St', '179 Street', 'Jamaica 179 St', 'Jamiaca'],
  'Jamaica - Van Wyck': ['Jamaica Van Wyck', 'Jamaica-Van Wyck'],
  'Ozone Park - Lefferts Blvd': ['Ozone Park'],
  'Rockaway Park - Beach 116 St': ['Rockaway Park'],
  'Canarsie - Rockaway Pkwy': ['Canarsie'],
  'Flushing - Main St': ['Flushing'],
  'Mount Dennis': ['Mt. Dennis', 'Mt Dennis'],
  'St. Clair West': ['St Clair West'],
  'St. Clair': ['St Clair'],
  'St. Clair West Station': ['St Clair West', 'St. Clair West'],
  'St. Clair Station': ['St Clair', 'St. Clair'],
  'Bellevue Downtown': ['Downtown Bellevue'],
  'International District / Chinatown': [
    'CID',
    'International District/CID',
    'CID/International District',
    'International District CID',
    'CID International District',
    'International District',
  ],
  'U District': ['University District'],
  'Hamilton GO Centre': ['Hamilton'],
  'Niagara Falls, Ontario': ['Niagara Falls'],
  Bresalu: ['Breslau'],
  'Wakefield - 241 St': ['Wakefield'],
  'Van Cortlandt Park - 242 St': ['Van Cortlandt Park'],
  'Eastchester - Dyre Av': ['Eastchester'],
  'Harlem-125 St': ['Harlem'],
  'Harlem - 148 St': ['Harlem'],
  'Flatbush Av - Brooklyn College': ['Brooklyn College'],
  'Crown Hts - Utica Av': ['Crown Heights', 'Utica'],
  'Middle Village - Metropolitan Av': ['Middle Village'],
  'Metropolitan Av': ['Parkside'],
  'P4': ['P4 Station'],
  "E 143 St - St Mary's St": ["E 143 St - St Marys St"],
  'Jackson Hts - Roosevelt Av': [
    'Jackson Hts',
    'Jackson Heights - Roosevelt Av',
    'Jackson Heights - Roosevelt Avenue',
  ],
  '74 St - Broadway': ['74 Street - Broadway'],
  '4 Av - 9 St': ['4 Av', '4 Ave', '4 Av 9 St', '4 Ave 9 St', '9 St'],
  'Smith - 9 Sts': ['Smith', 'Smith St', 'Smith Sts', '9 St', '9 Sts'],
  'Sutphin Blvd - Archer Av - JFK Airport': ['Jamaica Station'],
  'E 105 St': ['105 St'],
  '110 St - Malcolm X Plaza': ['110 St Central Park North'],
  'EWR Terminal A': [
    'Terminal A',
    'Newark Terminal A',
    'Newark Airport Terminal A',
    'Newark Liberty Terminal A',
  ],
  'EWR Terminal B': [
    'Terminal B',
    'Newark Terminal B',
    'Newark Airport Terminal B',
    'Newark Liberty Terminal B',
  ],
  'EWR Terminal C': [
    'Terminal C',
    'Newark Terminal C',
    'Newark Airport Terminal C',
    'Newark Liberty Terminal C',
  ],
  'JFK Terminal 1': ['Terminal 1'],
  'JFK Terminal 4': ['Terminal 4'],
  'JFK Terminal 5': ['Terminal 5'],
  'JFK Terminal 7': ['Terminal 7'],
  'JFK Terminal 8': ['Terminal 8'],
  'Glen Rock-Boro Hall': ['Boro Hall - Glen Rock'],
  'Lo Wu (羅湖)': ['Lo Hu', 'Lo Hu Station'],
  'Luohu (罗湖)': ['Lo Wu', 'Lo Hu', 'Lo Wu Station', 'Lo Hu Station'],
  'Lok Ma Chau (落馬洲)': ['Futian Checkpoint', 'Futian Checkpoint Station'],
  'Futian Checkpoint (福田口岸)': ['Lok Ma Chau', 'Lok Ma Chau Station'],
})

const AMTRAK_MANUAL_ALTERNATE_NAMES: Record<string, string[]> = {
  'Boston South Station, MA': ['Boston'],
  'Boston North Station, MA': ['Boston'],
  'Philadelphia, PA': ['Philly'],
  'Newark Liberty International Airport, NJ': [
    'Newark Airport',
    'Newark Liberty',
    'Newark International Airport',
    'RailLink',
    'Rail Link',
  ],
  'Albany-Rensselaer, NY': ['Albany'],
  'Oakland-Jack London Square, CA': ['Oakland'],
  'San Diego - Santa Fe Depot, CA': ['San Diego'],
  'New Haven - State St, CT': ['New Haven', 'New Haven State Street'],
  'New Haven Union Station, CT': ['New Haven'],
}

const AMTRAK_BLOCKED_ALTERNATE_NAMES: Record<string, string[]> = {
  'Back Bay, MA': ['Boston'],
  'Route 128, MA': ['Boston'],
}

const MANUAL_COMPLEX_GROUPS: ManualComplexSelector[][] = repairManualComplexGroups([
  [
    { name: 'Westlake Hub', line: 'SeattleStreetcarSLU' },
    { name: 'Westlake Center', line: 'SeattleCenterMonorail' },
    { name: 'Westlake' },
  ],
  [
    { name: 'Capitol Hill' },
    { name: 'Broadway & Howell', line: 'SeattleStreetcarFirstHill' },
  ],
  [
    { name: 'International District / Chinatown' },
    { name: '5th & Jackson', line: 'SeattleStreetcarFirstHill' },
  ],
  [
    { name: 'Metropolitan Av', line: 'IBX' },
    { name: 'Middle Village - Metropolitan Av', line: 'NewYorkSubwayM' },
  ],
  [
    { name: '62 St', line: 'NewYorkSubwayD' },
    { name: 'New Utrecht Av', line: 'NewYorkSubwayN' },
    { name: 'New Utrecht Av', line: 'IBX' },
  ],
  [
    { name: 'Roosevelt Av', line: 'IBX' },
    { name: '69 St - Fisk Av', line: 'NewYorkSubway7' },
    { name: 'Jackson Hts - Roosevelt Av', line: 'NewYorkSubwayE' },
    { name: 'Jackson Hts - Roosevelt Av', line: 'NewYorkSubwayF' },
    { name: 'Jackson Hts - Roosevelt Av', line: 'NewYorkSubwayM' },
    { name: 'Jackson Hts - Roosevelt Av', line: 'NewYorkSubwayR' },
    { name: '74 St - Broadway', line: 'NewYorkSubway7' },
  ],
  [
    { name: 'Howard Beach - JFK Airport', line: 'NewYorkSubwayA' },
    { name: 'Howard Beach', line: 'AirTrainJFKHowardBeach' },
  ],
  [
    { name: 'Avenue H', line: 'NewYorkSubwayQ' },
    { name: 'East 16 St', line: 'IBX' },
  ],
  [
    { name: 'Tai Koo', line: 'ISL' },
    { name: 'Kornhill', line: 'HKT' },
  ],
  [
    { name: 'Kew Gardens', linePrefix: 'LIRR' },
    { name: 'Kew Gardens - Union Tpke' },
  ],
  [
    { name: 'McDonald Av', line: 'IBX' },
    { name: 'Avenue I' },
  ],
  [
    { name: '4 Av', line: 'IBX' },
    { name: 'Bay Ridge Av', line: 'NewYorkSubwayR' },
  ],
  [
    { name: 'Flatbush Av - Brooklyn College' },
    { name: 'Flatbush-Nostrand Av', line: 'IBX' },
  ],
  [
    { name: 'East New York', linePrefix: 'LIRR' },
    { name: 'Broadway Jct' },
    { name: 'Atlantic Av', line: 'IBX' },
  ],
  [
    { name: 'Metropolitan Av', line: 'NewYorkSubwayG' },
    { name: 'Lorimer St', line: 'NewYorkSubwayL' },
  ],
  [
    { name: 'Hunterspoint Av', line: 'LIRRPortJefferson' },
    { name: 'Hunterspoint Av', line: 'LIRROysterBay' },
    { name: 'Hunterspoint Av', line: 'LIRRMontauk' },
    { name: 'Hunters Point Av', line: 'NewYorkSubway7' },
    { name: 'Hunters Point Av', line: 'NewYorkSubway7X' },
  ],
  [
    { name: 'Hunts Point Av', line: 'NewYorkSubway6' },
    { name: 'Hunts Point Av', line: 'NewYorkSubway6X' },
    { name: 'Hunts Point', line: 'MNRRNewHaven' },
  ],
  [
    { name: 'Livonia Av', line: 'NewYorkSubwayL' },
    { name: 'Livonia Av', line: 'IBX' },
    { name: 'Junius St', line: 'NewYorkSubway3' },
  ],
  [
    { name: 'Lorimer St', line: 'NewYorkSubwayJ' },
    { name: 'Lorimer St', line: 'NewYorkSubwayM' },
    { name: 'Broadway', line: 'NewYorkSubwayG' },
  ],
  [
    { name: '2 Av', line: 'NewYorkSubwayF' },
    { name: '2 Av', line: 'NewYorkSubwayFX' },
  ],
  [
    { name: 'Far Rockaway - Mott Av', line: 'NewYorkSubwayA' },
    { name: 'Far Rockaway', line: 'LIRRFarRockaway' },
  ],
  [
    { name: 'Marble Hill', line: 'MNRRHudson' },
    { name: 'Marble Hill - 225 St', line: 'NewYorkSubway1' },
  ],
  [
    { name: 'Harlem-125 St', line: 'MNRRHarlem' },
    { name: '125 St', line: 'NewYorkSubway4' },
    { name: '125 St', line: 'NewYorkSubway5' },
    { name: '125 St', line: 'NewYorkSubway6' },
    { name: '125 St', line: 'NewYorkSubway6X' },
    { name: '125 St', line: 'NewYorkSubwayQ' },
  ],
  [
    { name: 'Times Sq - 42 St' },
    { name: '42 St - Port Authority Bus Terminal' },
    { name: '42 St - Bryant Pk' },
    { name: '5 Av', line: 'NewYorkSubway7' },
    { name: '5 Av', line: 'NewYorkSubway7X' },
  ],
  [
    { name: 'South China Normal University (华师)', line: 'gzline10' },
    { name: 'South China Normal University (华师)', line: 'gzline11' },
  ],
  [
    { name: 'Taipei Zoo (動物園)', line: 'wenhu' },
    { name: 'Taipei Zoo (動物園)', line: 'maokong' },
  ],
  [
    { name: 'Zhonghe (中和)', line: 'circular' },
    { name: 'Zhonghe (中和)', line: 'wanda' },
  ],
  [
    { name: 'Plaza Universidad', line: 'gdl2' },
    { name: 'Guadalajara Centro', line: 'gdl3' },
  ],
  [
    { name: 'Félix U. Gomez', line: 'mty1' },
    { name: 'Félix U. Gomez', line: 'mty3' },
  ],
  [
    { name: 'Airport (机场)', line: 'szline11' },
    { name: 'Terminal 3 (3号航站楼)', line: 'szairportapm' },
  ],
  [
    { name: 'Terminal 1 (第一航廈)', line: 'skytrain' },
    { name: 'Airport Terminal 1 (機場第一航廈)', line: 'taoyuanairport' },
  ],
  [
    { name: 'Terminal 2 (第二航廈)', line: 'skytrain' },
    { name: 'Airport Terminal 2 (機場第二航廈)', line: 'taoyuanairport' },
  ],
  [
    { name: 'Cotai East (路氹東)', line: 'TPA' },
    { name: 'Skycab Station (觀光纜車站)', line: 'wynnskycab' },
  ],
  [
    { name: '34 St - Penn Station' },
    { name: 'New York Penn Station' },
  ],
  [
    { name: 'Sutphin Blvd - Archer Av - JFK Airport' },
    { name: 'Jamaica - Van Wyck' },
    { name: 'Jamaica', linePrefix: 'LIRR' },
    { name: 'Jamaica', linePrefix: 'AirTrainJFK' },
  ],
  [
    { name: 'Franklin Av - Medgar Evers College' },
    { name: 'Botanic Garden', line: 'NewYorkSubwayFS' },
  ],
  [
    { name: 'Court St', line: 'NewYorkSubwayR' },
    { name: 'Borough Hall' },
  ],
  [
    { name: 'Whitehall St' },
    { name: 'South Ferry' },
  ],
  [
    { name: 'Broadway-Lafayette St' },
    { name: 'Bleecker St', line: 'NewYorkSubway6' },
    { name: 'Bleecker St', line: 'NewYorkSubway6X' },
  ],
  [
    { name: 'Lexington Av/53 St' },
    { name: '51 St', line: 'NewYorkSubway6' },
  ],
  [
    { name: '59 St', line: 'NewYorkSubway4' },
    { name: '59 St', line: 'NewYorkSubway5' },
    { name: '59 St', line: 'NewYorkSubway6' },
    { name: 'Lexington Av/59 St' },
    { name: 'Lexington Av/63 St' },
  ],
  [
    { name: '33 St', line: 'NewYorkSubway6' },
    { name: '34 St - Herald Sq' },
  ],
  [
    { name: 'Chambers St', line: 'NewYorkSubway1' },
    { name: 'Chambers St', line: 'NewYorkSubway2' },
    { name: 'Chambers St', line: 'NewYorkSubway3' },
    { name: 'Chambers St', line: 'NewYorkSubwayA' },
    { name: 'Chambers St', line: 'NewYorkSubwayC' },
    { name: 'Park Pl', line: 'NewYorkSubway2' },
    { name: 'Park Pl', line: 'NewYorkSubway3' },
    { name: 'World Trade Center', line: 'NewYorkSubwayE' },
    { name: 'World Trade Center', line: 'NewYorkSubwayPATHHobwtc' },
    { name: 'World Trade Center', line: 'NewYorkSubwayPATHNwkwtc' },
    { name: 'Cortlandt St', line: 'NewYorkSubwayN' },
    { name: 'Cortlandt St', line: 'NewYorkSubwayR' },
    { name: 'Cortlandt St', line: 'NewYorkSubwayW' },
    { name: 'WTC Cortlandt', line: 'NewYorkSubway1' },
  ],
  [
    { name: 'Concourse T', line: 'atlantaTPT' },
    { name: 'Airport', line: 'MARTARD' },
  ],
  [
    { name: 'Denver Airport', line: 'Denver_RTD_A' },
    { name: 'Main Terminal', line: 'DenverAGTS' },
  ],
  [
    { name: 'Airport (機場)', line: 'AEL' },
    { name: 'Terminal 2 Interchange (二號客運大樓站)', line: 'HKAPMT1' },
    { name: 'Terminal 2 Interchange (二號客運大樓站)', line: 'HKAPMT2' },
    { name: 'Terminal 2 Interchange (二號客運大樓站)', line: 'HKAPMSKY' },
  ],
  [
    { name: 'Hong Kong West Kowloon (香港西九龍)', line: 'XRL' },
    { name: 'Kowloon (九龍)', line: 'TCL' },
    { name: 'Kowloon (九龍)', line: 'AEL' },
    { name: 'Austin (柯士甸)', line: 'TML' },
  ],
  [
    { name: 'Tsim Sha Tsui (尖沙咀)', line: 'TWL' },
    { name: 'East Tsim Sha Tsui (尖東)', line: 'TML' },
  ],
  [
    { name: 'Lok Ma Chau (落馬洲)', line: 'EAL' },
    { name: 'Futian Checkpoint (福田口岸)', line: 'szline4' },
  ],
  [
    { name: 'Lo Wu (羅湖)', line: 'EAL' },
    { name: 'Luohu (罗湖)', line: 'szline1' },
    { name: 'Luohu West (罗湖西)', line: 'szline17' },
    { name: 'Renmin South (人民南)', line: 'szline9' },
  ],
  [
    { name: 'Shenzhen North Station West Square (北站西广场)', line: 'szline27' },
    { name: 'Shenzhen North (深圳北)', line: 'szline4' },
    { name: 'Shenzhen North (深圳北)', line: 'szline5' },
    { name: 'Shenzhen North (深圳北)', line: 'szline6' },
    { name: 'Shenzhen North (深圳北)', line: 'XRL' },
  ],
  [
    { name: 'Guahu (观湖)', line: 'szline22' },
    { name: 'HTIP East (高新区东)', line: 'sztram1' },
  ],
  [
    { name: 'Tuen Mun South (屯門南)', line: 'TML' },
    { name: 'Tuen Mun Ferry Pier (屯門碼頭)', line: 'MTR507' },
    { name: 'Tuen Mun Ferry Pier (屯門碼頭)', line: 'MTR610' },
    { name: 'Tuen Mun Ferry Pier (屯門碼頭)', line: 'MTR614' },
    { name: 'Tuen Mun Ferry Pier (屯門碼頭)', line: 'MTR614P' },
    { name: 'Tuen Mun Ferry Pier (屯門碼頭)', line: 'MTR615' },
    { name: 'Tuen Mun Ferry Pier (屯門碼頭)', line: 'MTR615P' },
    { name: 'Siu Hei (兆禧)', line: 'MTR507' },
    { name: 'Siu Hei (兆禧)', line: 'MTR614' },
    { name: 'Siu Hei (兆禧)', line: 'MTR614P' },
  ],
  [
    { name: 'Ho Tin (河田)', line: 'MTR507' },
    { name: 'Tuen Mun (屯門)', line: 'TML' },
    { name: 'Tuen Mun (屯門)', line: 'MTR505' },
    { name: 'Tuen Mun (屯門)', line: 'MTR507' },
    { name: 'Tuen Mun (屯門)', line: 'MTR751' },
  ],
  [
    { name: 'Hub Building', line: 'HubTram' },
    { name: 'Terminal 2-Humphrey', line: 'MAXBlue' },
  ],
  [
    { name: 'Terminal 1', line: 'HubTram' },
    { name: 'Terminal 1-Lindbergh', line: 'MAXBlue' },
  ],
])

const MANUAL_AUTO_COMPLEX_EXCLUSIONS: ManualComplexSelector[][] =
  repairManualComplexGroups([])

const shouldApplyNyRouteOverrides = (cityName: string) =>
  cityName === 'nyc' || cityName === 'regional-rail'

const applyCityRouteOverrides = (
  routes: RoutesFeatureCollection | undefined,
  cityName: string,
): RoutesFeatureCollection | undefined => {
  if (!routes || !shouldApplyNyRouteOverrides(cityName)) {
    return routes
  }

  let changed = false
  const nextFeatures = routes.features.map((feature) => {
    const line = feature.properties?.line
    if (!line) {
      return feature
    }

    let nextProperties = feature.properties
    let nextGeometry = feature.geometry

    if (line === 'NewYorkSubwaySI' && feature.properties?.color !== '#0178C6') {
      nextProperties = {
        ...feature.properties,
        color: '#0178C6',
      }
      changed = true
    }

    if (nextProperties === feature.properties && nextGeometry === feature.geometry) {
      return feature
    }

    return {
      ...feature,
      properties: nextProperties,
      geometry: nextGeometry,
    }
  })

  if (!changed) {
    return routes
  }

  return {
    ...routes,
    features: nextFeatures,
  }
}

const DIRECTIONAL_ABBREVIATIONS: Record<string, string> = {
  east: 'E',
  west: 'W',
  north: 'N',
  south: 'S',
}

const CARDINAL_DIRECTIONS = Object.keys(DIRECTIONAL_ABBREVIATIONS)
const CARDINAL_DIRECTIONS_PATTERN = CARDINAL_DIRECTIONS.join('|')
const DIRECTION_SUFFIX_REGEX = new RegExp(
  `^(.*\\S)\\s+(${CARDINAL_DIRECTIONS_PATTERN})$`,
  'i',
)
const DIRECTION_PREFIX_REGEX = new RegExp(
  `^(${CARDINAL_DIRECTIONS_PATTERN})\\s+(.*\\S)$`,
  'i',
)

const STREET_SEGMENT_KEYWORDS = [
  ' st',
  ' street',
  ' av',
  ' ave',
  ' avenue',
  ' blvd',
  ' boulevard',
  ' rd',
  ' road',
  ' dr',
  ' drive',
  ' pkwy',
  ' parkway',
  ' way',
  ' wy',
  ' lane',
  ' ln',
  ' court',
  ' ct',
  ' place',
  ' pl',
  ' plaza',
  ' plz',
  ' terrace',
  ' ter',
  ' circle',
  ' cir',
  ' ferry',
  ' highway',
  ' hwy',
  ' expressway',
  ' expwy',
  ' center',
  ' centre',
  ' ctr',
  ' mall',
  ' bridge',
  ' broadway',
]

const shouldIncludeStandaloneSegment = (value: string) => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return false
  }
  if (/\d/.test(normalized)) {
    return true
  }
  return STREET_SEGMENT_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  )
}

const BLOCKED_HYPHEN_STANDALONE_SEGMENTS = new Set([
  'center',
  'centre',
  'central',
  'north',
  'south',
  'east',
  'west',
  'station',
  'gare',
  'saint',
  'sainte',
  'st',
  'ste',
  'nord',
  'sud',
  'est',
  'ouest',
])

const shouldIncludeHyphenStandaloneSegment = (value: string) => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  if (BLOCKED_HYPHEN_STANDALONE_SEGMENTS.has(normalized)) return false
  const compact = normalized.replace(/[^a-z0-9]/gi, '')
  return compact.length >= 4 && /[a-z]/i.test(compact)
}

const generateHyphenSegmentAlternates = (name?: string): string[] => {
  const input = repairMojibakeString(name ?? '').trim()
  if (!input) return []

  const parts = input
    .split(/\s*[-–]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length !== 2) return []

  const alternates = new Set<string>()
  parts.forEach((part) => {
    const withoutState = part.split(',')[0]?.trim() ?? ''
    ;[part, withoutState].forEach((candidate) => {
      if (shouldIncludeHyphenStandaloneSegment(candidate)) {
        alternates.add(candidate)
      }
    })
  })

  return Array.from(alternates)
}

const applyDirectionalAbbreviation = (value?: string) => {
  const input = (value ?? '').trim()
  if (!input || !/\s/.test(input)) {
    return input
  }

  return input.replace(/\b(East|West|North|South)\b/gi, (match) => {
    const key = match.toLowerCase()
    return DIRECTIONAL_ABBREVIATIONS[key] ?? match
  })
}

const generateAlternateNames = (name?: string): string[] => {
  if (!name) return []
  const trimmed = repairMojibakeString(name).trim()
  if (!trimmed) return []

  const directionalName = applyDirectionalAbbreviation(trimmed)
  const canonical = directionalName

  const alternates = new Set<string>()
  const englishPortion = trimmed.replace(/\s*\(.*?\)\s*$/, '').trim()
  const parentheticalMatch = trimmed.match(/\((.*?)\)/)
  const parenthetical = parentheticalMatch?.[1]?.trim() ?? ''

  const addSaintVariants = (value: string) => {
    const source = value.trim()
    if (!source) return
    const variants = new Set<string>([source])
    variants.forEach((variant) => {
      const st = variant
        .replace(/\bSainte\b/g, 'Ste')
        .replace(/\bSaint\b/g, 'St')
      const stWithPeriod = variant
        .replace(/\bSainte\b/g, 'Ste.')
        .replace(/\bSaint\b/g, 'St.')
      if (st !== variant) alternates.add(st)
      if (stWithPeriod !== variant) alternates.add(stWithPeriod)
    })
  }

  const HIGH_SPEED_ENGLISH_PATTERNS = [
    /\s+High[- ]Speed Railway Station$/i,
    /\s+High[- ]Speed Rail(?:way)? Station$/i,
    /\s+HSR Station$/i,
  ]
  const HIGH_SPEED_CHINESE_PATTERNS = [/\u9ad8\u94c1\u7ad9$/, /\u9ad8\u9435\u7ad9$/]

  const addHighSpeedShortcuts = (value: string, patterns: RegExp[]) => {
    const source = value.trim()
    if (!source) return
    patterns.forEach((pattern) => {
      if (pattern.test(source)) {
        const shortened = source.replace(pattern, '').trim()
        if (shortened) {
          alternates.add(shortened)
        }
      }
    })
  }

  const formatDirection = (direction: string) =>
    direction.charAt(0).toUpperCase() + direction.slice(1).toLowerCase()

  const baseForCrossNames = englishPortion || trimmed

  if (baseForCrossNames) {
    const crossParts = baseForCrossNames
      .split(/\s*(?:&|\/| and )\s*/i)
      .map((part) => part.trim())
      .filter(Boolean)

    if (crossParts.length >= 2) {
      const [first, second] = crossParts
      const separators = [' & ', ' and ', ' / ']
      const compactSeparators = ['&', '/', ' and ']

      const addCrossAlternate = (a: string, b: string) => {
        separators.forEach((sep) => alternates.add(`${a}${sep}${b}`.trim()))
        compactSeparators.forEach((sep) =>
          alternates.add(`${a}${sep}${b}`.trim()),
        )
      }

      addCrossAlternate(first, second)
      addCrossAlternate(second, first)
    }
  }

  if (englishPortion) {
    addHighSpeedShortcuts(englishPortion, HIGH_SPEED_ENGLISH_PATTERNS)
  }
  if (parenthetical) {
    addHighSpeedShortcuts(parenthetical, HIGH_SPEED_CHINESE_PATTERNS)
  }

  if (englishPortion) {
    const suffixMatch = englishPortion.match(DIRECTION_SUFFIX_REGEX)
    if (suffixMatch) {
      const baseSegment = suffixMatch[1]?.replace(/\s+/g, ' ').trim()
      const directionSegment = suffixMatch[2]
      if (baseSegment && directionSegment) {
        alternates.add(`${formatDirection(directionSegment)} ${baseSegment}`)
      }
    }

    const prefixMatch = englishPortion.match(DIRECTION_PREFIX_REGEX)
    if (prefixMatch) {
      const directionSegment = prefixMatch[1]
      const baseSegment = prefixMatch[2]?.replace(/\s+/g, ' ').trim()
      if (baseSegment && directionSegment) {
        alternates.add(`${baseSegment} ${formatDirection(directionSegment)}`)
      }
    }
  }

  if (directionalName !== trimmed) {
    alternates.add(directionalName)
  }

  addSaintVariants(trimmed)
  if (directionalName !== trimmed) {
    addSaintVariants(directionalName)
  }

  if (canonical !== trimmed && canonical !== directionalName) {
    alternates.add(canonical)
  }

  for (const { delimiter, joiner } of CONNECTOR_CONFIG) {
    if (canonical.includes(delimiter)) {
      const parts = canonical
        .split(delimiter)
        .map((part) => part.trim())
        .filter(Boolean)

      if (parts.length >= 2) {
        const reversed = [...parts].reverse()

        alternates.add(reversed.join(joiner))
        alternates.add(parts.join(' '))
        alternates.add(reversed.join(' '))

        parts.forEach((part) => {
          if (shouldIncludeStandaloneSegment(part)) {
            alternates.add(part)
          }
        })
      }
    }
  }

  if (/port authority bus terminal/i.test(canonical)) {
    alternates.add(canonical.replace(/port authority bus terminal/gi, 'PABT'))
    alternates.add('PABT')
  }

  const beachMatch = canonical.match(/^Beach\s+(\d+)\s*St\b(.*)$/i)
  if (beachMatch) {
    const suffix = beachMatch[2] ?? ''
    const suffixTrimmed = suffix.trim()
    const number = beachMatch[1]
    alternates.add(`B ${number} St`)
    alternates.add(`B ${number}th St`)
    if (suffixTrimmed) {
      const withDash = suffix.startsWith(' ') ? suffix : ` ${suffix}`
      alternates.add(`B ${number} St${withDash}`)
      alternates.add(`B ${number}th St${withDash}`)
    }
  }

  const replacementPatterns: Array<{ regex: RegExp; replacement: string }> = [
    { regex: /\bCrescent\b/g, replacement: 'Cr' },
    { regex: /\bCr\b/g, replacement: 'Crescent' },
    { regex: /\bPark\b/g, replacement: 'Pk' },
    { regex: /\bPlaza\b/g, replacement: 'Plz' },
    { regex: /\bPoint\b/g, replacement: 'Pt' },
    { regex: /\bRoute\b/g, replacement: 'Rte' },
    { regex: /\bGymnasium\b/g, replacement: 'Gym' },
  ]

  for (const { regex, replacement } of replacementPatterns) {
    const replacedOriginal = trimmed.replace(regex, replacement)
    if (replacedOriginal !== trimmed) {
      alternates.add(replacedOriginal)
    }

    const replacedDirectional = directionalName.replace(regex, replacement)
    if (
      directionalName !== trimmed &&
      replacedDirectional !== directionalName
    ) {
      alternates.add(replacedDirectional)
    }

    const replacedCanonical = canonical.replace(regex, replacement)
    if (replacedCanonical !== canonical) {
      alternates.add(replacedCanonical)
    }
  }

  if (/broadway/i.test(canonical)) {
    const lower = canonical.toLowerCase()
    alternates.add(canonical.replace(/Broadway/gi, 'Bway'))
    alternates.add(canonical.replace(/Broadway/gi, "B'way"))
    alternates.add(lower.replace(/broadway/g, 'bway'))
    alternates.add(lower.replace(/broadway/g, "b'way"))
  }

  MANUAL_ALTERNATE_NAMES[trimmed]?.forEach((alias) => {
    if (alias) {
      alternates.add(repairMojibakeString(alias))
    }
  })

  if (directionalName !== trimmed) {
  MANUAL_ALTERNATE_NAMES[directionalName]?.forEach((alias) => {
    if (alias) {
      alternates.add(repairMojibakeString(alias))
    }
  })
  }

  if (canonical !== trimmed && canonical !== directionalName) {
  MANUAL_ALTERNATE_NAMES[canonical]?.forEach((alias) => {
    if (alias) {
      alternates.add(repairMojibakeString(alias))
    }
  })
  }

  return Array.from(alternates)
}

const normalizeAliasSpacing = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/^[,\-]\s*/g, '')
    .replace(/\s*[,\-]\s*$/g, '')
    .trim()

const USPS_STREET_SUFFIX_GROUPS = [
  ['ALLEY', 'ALLEE', 'ALLEY', 'ALLY', 'ALY'],
  ['ANEX', 'ANEX', 'ANNEX', 'ANNX', 'ANX'],
  ['ARCADE', 'ARC', 'ARCADE'],
  ['AVENUE', 'AV', 'AVE', 'AVEN', 'AVENU', 'AVENUE', 'AVN', 'AVNUE'],
  ['BAYOU', 'BAYOO', 'BAYOU', 'BYU'],
  ['BEACH', 'BCH', 'BEACH'],
  ['BEND', 'BEND', 'BND'],
  ['BLUFF', 'BLF', 'BLUF', 'BLUFF'],
  ['BLUFFS', 'BLUFFS', 'BLFS'],
  ['BOTTOM', 'BOT', 'BOTTOM', 'BOTTM', 'BTM'],
  ['BOULEVARD', 'BLVD', 'BOUL', 'BOULEVARD', 'BOULV'],
  ['BRANCH', 'BR', 'BRANCH', 'BRNCH'],
  ['BRIDGE', 'BRDGE', 'BRG', 'BRIDGE'],
  ['BROOK', 'BRK', 'BROOK'],
  ['BROOKS', 'BROOKS', 'BRKS'],
  ['BURG', 'BURG', 'BG'],
  ['BURGS', 'BURGS', 'BGS'],
  ['BYPASS', 'BYP', 'BYPA', 'BYPAS', 'BYPASS', 'BYPS'],
  ['CAMP', 'CAMP', 'CMP', 'CP'],
  ['CANYON', 'CANYN', 'CANYON', 'CNYN', 'CYN'],
  ['CAPE', 'CAPE', 'CPE'],
  ['CAUSEWAY', 'CAUSEWAY', 'CAUSWA', 'CSWY'],
  ['CENTER', 'CEN', 'CENT', 'CENTER', 'CENTR', 'CENTRE', 'CNTER', 'CNTR', 'CTR'],
  ['CENTERS', 'CENTERS', 'CTRS'],
  ['CIRCLE', 'CIR', 'CIRC', 'CIRCL', 'CIRCLE', 'CRCL', 'CRCLE'],
  ['CIRCLES', 'CIRCLES', 'CIRS'],
  ['CLIFF', 'CLF', 'CLIFF'],
  ['CLIFFS', 'CLFS', 'CLIFFS'],
  ['CLUB', 'CLB', 'CLUB'],
  ['COMMON', 'COMMON', 'CMN'],
  ['COMMONS', 'COMMONS', 'CMNS'],
  ['CORNER', 'COR', 'CORNER'],
  ['CORNERS', 'CORNERS', 'CORS'],
  ['COURSE', 'COURSE', 'CRSE'],
  ['COURT', 'COURT', 'CT'],
  ['COURTS', 'COURTS', 'CTS'],
  ['COVE', 'COVE', 'CV'],
  ['COVES', 'COVES', 'CVS'],
  ['CREEK', 'CREEK', 'CRK'],
  ['CRESCENT', 'CRES', 'CRESCENT', 'CRSENT', 'CRSNT'],
  ['CREST', 'CREST', 'CRST'],
  ['CROSSING', 'CROSSING', 'CRSSNG', 'XING'],
  ['CROSSROAD', 'CROSSROAD', 'XRD'],
  ['CROSSROADS', 'CROSSROADS', 'XRDS'],
  ['CURVE', 'CURVE', 'CURV'],
  ['DALE', 'DALE', 'DL'],
  ['DAM', 'DAM', 'DM'],
  ['DIVIDE', 'DIV', 'DIVIDE', 'DV', 'DVD'],
  ['DRIVE', 'DR', 'DRIV', 'DRIVE', 'DRV'],
  ['DRIVES', 'DRIVES', 'DRS'],
  ['ESTATE', 'EST', 'ESTATE'],
  ['ESTATES', 'ESTATES', 'ESTS'],
  ['EXPRESSWAY', 'EXP', 'EXPRESS', 'EXPRESSWAY', 'EXPR', 'EXPW', 'EXPY'],
  ['EXTENSION', 'EXT', 'EXTENSION', 'EXTN', 'EXTNSN'],
  ['EXTENSIONS', 'EXTS'],
  ['FALL', 'FALL'],
  ['FALLS', 'FALLS', 'FLS'],
  ['FERRY', 'FERRY', 'FRRY', 'FRY'],
  ['FIELD', 'FIELD', 'FLD'],
  ['FIELDS', 'FIELDS', 'FLDS'],
  ['FLAT', 'FLAT', 'FLT'],
  ['FLATS', 'FLATS', 'FLTS'],
  ['FORD', 'FORD', 'FRD'],
  ['FORDS', 'FORDS', 'FRDS'],
  ['FOREST', 'FOREST', 'FORESTS', 'FRST'],
  ['FORGE', 'FORG', 'FORGE', 'FRG'],
  ['FORGES', 'FORGES', 'FRGS'],
  ['FORK', 'FORK', 'FRK'],
  ['FORKS', 'FORKS', 'FRKS'],
  ['FORT', 'FORT', 'FRT', 'FT'],
  ['FREEWAY', 'FREEWAY', 'FREEWY', 'FRWAY', 'FRWY', 'FWY'],
  ['GARDEN', 'GARDEN', 'GARDN', 'GDN', 'GRDEN', 'GRDN'],
  ['GARDENS', 'GARDENS', 'GDNS', 'GRDNS'],
  ['GATEWAY', 'GATEWAY', 'GATEWY', 'GATWAY', 'GTWAY', 'GTWY'],
  ['GLEN', 'GLEN', 'GLN'],
  ['GLENS', 'GLENS', 'GLNS'],
  ['GREEN', 'GREEN', 'GRN'],
  ['GREENS', 'GREENS', 'GRNS'],
  ['GROVE', 'GROV', 'GROVE', 'GRV'],
  ['GROVES', 'GROVES', 'GRVS'],
  ['HARBOR', 'HARB', 'HARBOR', 'HARBR', 'HBR', 'HRBOR'],
  ['HARBORS', 'HARBORS', 'HBRS'],
  ['HAVEN', 'HAVEN', 'HVN'],
  ['HEIGHTS', 'HT', 'HTS'],
  ['HIGHWAY', 'HIGHWAY', 'HIGHWY', 'HIWAY', 'HIWY', 'HWAY', 'HWY'],
  ['HILL', 'HILL', 'HL'],
  ['HILLS', 'HILLS', 'HLS'],
  ['HOLLOW', 'HLLW', 'HOLLOW', 'HOLLOWS', 'HOLW', 'HOLWS'],
  ['INLET', 'INLT'],
  ['ISLAND', 'IS', 'ISLAND', 'ISLND'],
  ['ISLANDS', 'ISLANDS', 'ISLNDS', 'ISS'],
  ['ISLE', 'ISLE', 'ISLES'],
  ['JUNCTION', 'JCT', 'JCTION', 'JCTN', 'JUNCTION', 'JUNCTN', 'JUNCTON'],
  ['JUNCTIONS', 'JCTNS', 'JCTS', 'JUNCTIONS'],
  ['KEY', 'KEY', 'KY'],
  ['KEYS', 'KEYS', 'KYS'],
  ['KNOLL', 'KNL', 'KNOL', 'KNOLL'],
  ['KNOLLS', 'KNLS', 'KNOLLS'],
  ['LAKE', 'LAKE', 'LK'],
  ['LAKES', 'LAKES', 'LKS'],
  ['LAND', 'LAND'],
  ['LANDING', 'LANDING', 'LNDG', 'LNDNG'],
  ['LANE', 'LANE', 'LN'],
  ['LIGHT', 'LGT', 'LIGHT'],
  ['LIGHTS', 'LIGHTS', 'LGTS'],
  ['LOAF', 'LF', 'LOAF'],
  ['LOCK', 'LCK', 'LOCK'],
  ['LOCKS', 'LCKS', 'LOCKS'],
  ['LODGE', 'LDG', 'LDGE', 'LODG', 'LODGE'],
  ['LOOP', 'LOOP', 'LOOPS'],
  ['MALL', 'MALL'],
  ['MANOR', 'MANOR', 'MNR'],
  ['MANORS', 'MANORS', 'MNRS'],
  ['MEADOW', 'MEADOW', 'MDW'],
  ['MEADOWS', 'MDW', 'MDWS', 'MEADOWS', 'MEDOWS'],
  ['MEWS', 'MEWS'],
  ['MILL', 'MILL', 'ML'],
  ['MILLS', 'MILLS', 'MLS'],
  ['MISSION', 'MISSN', 'MSN', 'MSSN'],
  ['MOTORWAY', 'MOTORWAY', 'MTWY'],
  ['MOUNT', 'MNT', 'MOUNT', 'MT'],
  ['MOUNTAIN', 'MNTAIN', 'MNTN', 'MOUNTAIN', 'MOUNTIN', 'MTIN', 'MTN'],
  ['MOUNTAINS', 'MNTNS', 'MOUNTAINS', 'MTNS'],
  ['NECK', 'NCK', 'NECK'],
  ['ORCHARD', 'ORCH', 'ORCHARD', 'ORCHRD'],
  ['OVAL', 'OVAL', 'OVL'],
  ['OVERPASS', 'OVERPASS', 'OPAS'],
  ['PARK', 'PARK', 'PARKS', 'PRK'],
  ['PARKWAY', 'PARKWAY', 'PARKWAYS', 'PARKWY', 'PKWAY', 'PKWY', 'PKWYS', 'PKY'],
  ['PASS', 'PASS'],
  ['PASSAGE', 'PASSAGE', 'PSGE'],
  ['PATH', 'PATH', 'PATHS'],
  ['PIKE', 'PIKE', 'PIKES'],
  ['PINE', 'PINE', 'PNE'],
  ['PINES', 'PINES', 'PNES'],
  ['PLACE', 'PL', 'PLACE'],
  ['PLAIN', 'PLAIN', 'PLN'],
  ['PLAINS', 'PLAINS', 'PLNS'],
  ['PLAZA', 'PLAZA', 'PLZ', 'PLZA'],
  ['POINT', 'POINT', 'PT'],
  ['POINTS', 'POINTS', 'PTS'],
  ['PORT', 'PORT', 'PRT'],
  ['PORTS', 'PORTS', 'PRTS'],
  ['PRAIRIE', 'PR', 'PRAIRIE', 'PRR'],
  ['RADIAL', 'RAD', 'RADIAL', 'RADIEL', 'RADL'],
  ['RAMP', 'RAMP'],
  ['RANCH', 'RANCH', 'RANCHES', 'RNCH', 'RNCHS'],
  ['RAPID', 'RAPID', 'RPD'],
  ['RAPIDS', 'RAPIDS', 'RPDS'],
  ['REST', 'REST', 'RST'],
  ['RIDGE', 'RDG', 'RDGE', 'RIDGE'],
  ['RIDGES', 'RDGS', 'RIDGES'],
  ['RIVER', 'RIV', 'RIVER', 'RIVR', 'RVR'],
  ['ROAD', 'RD', 'ROAD'],
  ['ROADS', 'RDS', 'ROADS'],
  ['ROUTE', 'ROUTE', 'RTE'],
  ['ROW', 'ROW'],
  ['RUE', 'RUE'],
  ['RUN', 'RUN'],
  ['SHOAL', 'SHL', 'SHOAL'],
  ['SHOALS', 'SHLS', 'SHOALS'],
  ['SHORE', 'SHOAR', 'SHORE', 'SHR'],
  ['SHORES', 'SHOARS', 'SHORES', 'SHRS'],
  ['SKYWAY', 'SKYWAY', 'SKWY'],
  ['SPRING', 'SPG', 'SPNG', 'SPRING', 'SPRNG'],
  ['SPRINGS', 'SPGS', 'SPNGS', 'SPRINGS', 'SPRNGS'],
  ['SPUR', 'SPUR', 'SPURS'],
  ['SQUARE', 'SQ', 'SQR', 'SQRE', 'SQU', 'SQUARE'],
  ['SQUARES', 'SQRS', 'SQS', 'SQUARES'],
  ['STATION', 'STA', 'STATION', 'STATN', 'STN'],
  ['STRAVENUE', 'STRA', 'STRAV', 'STRAVEN', 'STRAVENUE', 'STRAVN', 'STRVN', 'STRVNUE'],
  ['STREAM', 'STREAM', 'STREME', 'STRM'],
  ['STREET', 'ST', 'STR', 'STREET', 'STRT'],
  ['STREETS', 'STREETS', 'STS'],
  ['SUMMIT', 'SMT', 'SUMIT', 'SUMITT', 'SUMMIT'],
  ['TERRACE', 'TER', 'TERR', 'TERRACE'],
  ['THROUGHWAY', 'THROUGHWAY', 'TRWY'],
  ['TRACE', 'TRACE', 'TRACES', 'TRCE'],
  ['TRACK', 'TRACK', 'TRACKS', 'TRAK', 'TRK', 'TRKS'],
  ['TRAFFICWAY', 'TRAFFICWAY', 'TRFY'],
  ['TRAIL', 'TRAIL', 'TRAILS', 'TRL', 'TRLS'],
  ['TRAILER', 'TRAILER', 'TRLR', 'TRLRS'],
  ['TUNNEL', 'TUNEL', 'TUNL', 'TUNLS', 'TUNNEL', 'TUNNELS', 'TUNNL'],
  ['TURNPIKE', 'TRNPK', 'TURNPIKE', 'TURNPK', 'TPKE'],
  ['UNDERPASS', 'UNDERPASS', 'UPAS'],
  ['UNION', 'UN', 'UNION'],
  ['UNIONS', 'UNIONS', 'UNS'],
  ['VALLEY', 'VALLEY', 'VALLY', 'VLLY', 'VLY'],
  ['VALLEYS', 'VALLEYS', 'VLYS'],
  ['VIADUCT', 'VDCT', 'VIA', 'VIADCT', 'VIADUCT'],
  ['VIEW', 'VIEW', 'VW'],
  ['VIEWS', 'VIEWS', 'VWS'],
  ['VILLAGE', 'VILL', 'VILLAG', 'VILLAGE', 'VILLG', 'VILLIAGE', 'VLG'],
  ['VILLAGES', 'VILLAGES', 'VLGS'],
  ['VILLE', 'VILLE', 'VL'],
  ['VISTA', 'VIS', 'VIST', 'VISTA', 'VST', 'VSTA'],
  ['WALK', 'WALK', 'WALKS'],
  ['WALL', 'WALL'],
  ['WAY', 'WAY', 'WY'],
  ['WAYS', 'WAYS'],
  ['WELL', 'WELL', 'WL'],
  ['WELLS', 'WELLS', 'WLS'],
] as const

const STREET_SUFFIX_ALIAS_GROUPS = USPS_STREET_SUFFIX_GROUPS.map((group) =>
  Array.from(new Set(group)),
)

const FACILITY_SUFFIX_PATTERNS = [
  /\bTransit Cent(?:er|re)$/i,
  /\bTransportation Cent(?:er|re)$/i,
  /\bTransport Centre$/i,
  /\bGO Cent(?:er|re)$/i,
  /\bBus Terminal$/i,
  /\bRail Terminal$/i,
  /\bTerminal$/i,
  /\bDepot$/i,
]

const SHORT_SUFFIX_ALIAS_BLOCKLIST = new Set([
  'center',
  'centre',
  'depot',
  'downtown',
  'east',
  'main',
  'north',
  'south',
  'station',
  'terminal',
  'transit',
  'west',
])

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const formatStreetSuffixAlias = (value: string) =>
  value.toLowerCase().replace(/^[a-z]/, (char) => char.toUpperCase())

const shouldIncludeShortSuffixAlias = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return (
    normalized.length >= 4 &&
    /[a-z0-9]/i.test(normalized) &&
    !SHORT_SUFFIX_ALIAS_BLOCKLIST.has(normalized)
  )
}

const generateStreetSuffixAlternates = (value?: string): string[] => {
  const input = normalizeAliasSpacing(repairMojibakeString(value ?? ''))
  if (!input) {
    return []
  }

  const alternates = new Set<string>()
  const addBareAlias = (candidate: string) => {
    const alias = normalizeAliasSpacing(candidate)
    if (alias && shouldIncludeShortSuffixAlias(alias)) {
      alternates.add(alias)
    }
  }

  STREET_SUFFIX_ALIAS_GROUPS.forEach((terms) => {
    const suffixRegex = new RegExp(
      `\\b(?:${terms.map(escapeRegExp).join('|')})\\.?$`,
      'i',
    )
    if (!suffixRegex.test(input)) {
      return
    }

    const base = normalizeAliasSpacing(input.replace(suffixRegex, ''))
    if (!base) {
      return
    }

    terms.forEach((term) => {
      alternates.add(`${base} ${formatStreetSuffixAlias(term)}`)
    })
    addBareAlias(base)
  })

  FACILITY_SUFFIX_PATTERNS.forEach((pattern) => {
    if (!pattern.test(input)) {
      return
    }

    addBareAlias(input.replace(pattern, ''))
  })

  return Array.from(alternates).filter(
    (alternate) => alternate.toLowerCase() !== input.toLowerCase(),
  )
}

const buildLineImageConfetti = (
  lines: Record<string, { icon?: string } | undefined>,
) => {
  const images: { src: string; width: number; height: number }[] = []
  const seen = new Set<string>()

  Object.values(lines || {}).forEach((line) => {
    const icon = line?.icon
    if (!icon || typeof icon !== 'string') return
    const src = `/images/${icon}`
    if (seen.has(src)) return
    seen.add(src)
    images.push({ src, width: 64, height: 64 })
  })

  return images.length > 0 ? images : null
}


const shouldAutoFocus = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

const isTextEntryElement = (element: Element | null) => {
  if (!element || !(element instanceof HTMLElement)) {
    return false
  }

  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  )
}

const shouldRestoreMainInputFocus = (inputElement: HTMLInputElement | null) => {
  if (!shouldAutoFocus()) {
    return false
  }

  if (typeof document === 'undefined') {
    return false
  }

  const activeElement = document.activeElement

  if (
    !activeElement ||
    activeElement === document.body ||
    activeElement === document.documentElement ||
    activeElement === inputElement
  ) {
    return true
  }

  return !isTextEntryElement(activeElement)
}

type LngLatBox = [number, number, number, number]

const toLngLatBox = (bounds: unknown): LngLatBox | null => {
  if (!Array.isArray(bounds)) return null
  const flat = (bounds as unknown[]).flat(2).map(Number)
  if (flat.length !== 4 || !flat.every((n) => Number.isFinite(n))) return null
  const [a, b, c, d] = flat
  return [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)]
}

const mercatorY = (lat: number) => {
  const clamped = Math.max(-85, Math.min(85, lat))
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360))
}

/**
 * Some configs set a minZoom (and maxBounds) sized for one city, which on
 * country-wide networks (Shinkansen, VIA Rail, …) stops you from zooming out
 * far enough to see the whole network. Loosen both so it always fits on screen.
 */
const relaxZoomLimitsToFitNetwork = (
  options: Record<string, any>,
  dataBounds: LngLatBox | undefined,
  container: HTMLElement | null,
) => {
  const box = dataBounds ?? toLngLatBox(options.bounds)
  if (!box) return
  const width = Math.max(container?.clientWidth ?? 0, 320)
  const height = Math.max(container?.clientHeight ?? 0, 320)
  const lngSpan = Math.max(box[2] - box[0], 1e-6)
  const ySpan = Math.max(mercatorY(box[3]) - mercatorY(box[1]), 1e-6)
  const fitZoom = Math.min(
    Math.log2((width * 360) / (512 * lngSpan)),
    Math.log2((height * 2 * Math.PI) / (512 * ySpan)),
  )
  const loosestZoom = Math.max(0, Math.floor((fitZoom - 1) * 2) / 2)
  if (typeof options.minZoom === 'number' && options.minZoom > loosestZoom) {
    options.minZoom = loosestZoom
  }

  const maxBox = toLngLatBox(options.maxBounds)
  if (maxBox) {
    const padLng = (box[2] - box[0]) * 0.75
    const padLat = (box[3] - box[1]) * 0.75
    options.maxBounds = [
      [
        Math.max(-180, Math.min(maxBox[0], box[0] - padLng)),
        Math.max(-85, Math.min(maxBox[1], box[1] - padLat)),
      ],
      [
        Math.min(180, Math.max(maxBox[2], box[2] + padLng)),
        Math.min(85, Math.max(maxBox[3], box[3] + padLat)),
      ],
    ]
  }
}

/**
 * Route data built from OpenStreetMap arrives as thousands of tiny track
 * pieces per line. When zoomed far out, the map drops pieces shorter than
 * about a pixel, and runs of them leave visible gaps. Chaining pieces that
 * share an endpoint into long lines keeps the routes whole at every zoom.
 */
const mergeRoutePieces = <T extends { type: string; features: any[] }>(
  collection: T,
): T => {
  const keyOf = (point: number[]) => `${point[0]},${point[1]}`
  let changed = false
  const features = collection.features.map((feature) => {
    const geometry = feature?.geometry
    if (!geometry || geometry.type !== 'MultiLineString') return feature
    const parts: number[][][] = geometry.coordinates.filter(
      (part: number[][]) => Array.isArray(part) && part.length >= 2,
    )
    if (parts.length < 2) return feature

    const byEndpoint = new Map<string, number[]>()
    parts.forEach((part, index) => {
      for (const key of [keyOf(part[0]), keyOf(part[part.length - 1])]) {
        const list = byEndpoint.get(key)
        if (list) list.push(index)
        else byEndpoint.set(key, [index])
      }
    })
    const used = new Array(parts.length).fill(false)
    const takeNext = (point: number[]) => {
      for (const index of byEndpoint.get(keyOf(point)) ?? []) {
        if (used[index]) continue
        used[index] = true
        const part = parts[index]
        return keyOf(part[0]) === keyOf(point) ? part : [...part].reverse()
      }
      return null
    }

    const merged: number[][][] = []
    for (let i = 0; i < parts.length; i += 1) {
      if (used[i]) continue
      used[i] = true
      let line = parts[i].slice()
      for (let next = takeNext(line[line.length - 1]); next; next = takeNext(line[line.length - 1])) {
        line = line.concat(next.slice(1))
      }
      for (let prev = takeNext(line[0]); prev; prev = takeNext(line[0])) {
        line = prev.slice().reverse().concat(line.slice(1))
      }
      merged.push(line)
    }
    if (merged.length === geometry.coordinates.length) return feature
    changed = true
    return { ...feature, geometry: { ...geometry, coordinates: merged } }
  })
  return changed ? { ...collection, features } : collection
}

export default function GamePage({
  fc,
  routes,
}: {
  fc: DataFeatureCollection
  routes?: RoutesFeatureCollection
}) {
  return (
    <Suspense fallback={null}>
      <GamePageContent fc={fc} routes={routes} />
    </Suspense>
  )
}

function GamePageContent({
  fc,
  routes,
}: {
  fc: DataFeatureCollection
  routes?: RoutesFeatureCollection
}) {
  const {
    CITY_NAME,
    ASSET_BASE_PATH,
    MAP_CONFIG,
    LINES,
    MAP_FROM_DATA,
    MAP_RENDER_CULLING,
    METADATA,
  } =
    useConfig()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const cityPath = useMemo(
    () => ASSET_BASE_PATH ?? pathname?.replace(/^\//, '') ?? null,
    [ASSET_BASE_PATH, pathname],
  )
  const isChinaCity = useMemo(
    () => Boolean(cityPath?.startsWith('asia/china/')),
    [cityPath],
  )
  const miniCityLinks = useMemo(() => getMiniCityLinksForSlug(CITY_NAME), [CITY_NAME])
  const isMiniCity = useMemo(() => isMiniCitySlug(CITY_NAME), [CITY_NAME])
  const isCustomWorldMap = useMemo(() => CITY_NAME.startsWith('custom-world-'), [CITY_NAME])
  const isCustomGame = pathname === '/custom'
  const customParentSlug = searchParams.get('parent')?.trim() || null
  const debugMapProviderEnabled = searchParams.get('debugMapProvider') === '1'
  const progressScopeSlug = useMemo(() => {
    if (pathname === '/custom' && customParentSlug) {
      return customParentSlug
    }
    if (miniCityLinks?.mode === 'child') {
      return miniCityLinks.parent?.parentSlug ?? CITY_NAME
    }
    return CITY_NAME
  }, [CITY_NAME, customParentSlug, miniCityLinks, pathname])
  // City a custom layout is built from: the full city behind a smaller version
  // or behind the custom game being played.
  const customLayoutParentSlug = useMemo(() => {
    if (pathname === '/custom' && customParentSlug) return customParentSlug
    if (miniCityLinks?.mode === 'child') return miniCityLinks.parent?.parentSlug ?? CITY_NAME
    return CITY_NAME
  }, [CITY_NAME, customParentSlug, miniCityLinks, pathname])
  const currentCustomLayout = useMemo(
    () => (pathname === '/custom' && !isCustomWorldMap ? parseCustomLayout(searchParams) : null),
    [isCustomWorldMap, pathname, searchParams],
  )
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { settings, requestInMainlandChina } = useSettings()
  const prefersChineseCopy = settings.language.startsWith('zh')
  const { showAds } = useShouldShowAds()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  
  const [zenMode, setZenMode] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  // Layout the creator opens with: null = a fresh layout.
  const [customEditing, setCustomEditing] = useState<
    (CustomLayout & { id?: string | null }) | null
  >(null)
  useEffect(() => {
    if (!cityPath) return

    rememberLastPlayedCity({
      slug: CITY_NAME,
      path: `/${cityPath}`,
    })
  }, [CITY_NAME, cityPath])
  const [mistakes, setMistakes] = useState(0)
  const savedMapViewRef = useRef<StoredMapView | null>(null)
  const initialMapViewRef = useRef<StoredMapView | null>(null)
  const mapPersistTimeoutRef = useRef<number | null>(null)
  const lastPersistTsRef = useRef<number>(0)
  const mapUnavailableRef = useRef(false)
  const comebackTriggeredRef = useRef(false)
  const comebackArmedRef = useRef(false)
  const earnedAchievementsRef = useRef<Set<string>>(new Set())
  const lineMasterEarnedRef = useRef<Set<string>>(new Set())
  const lastPlayDateRef = useRef<string | null>(null)
  const achievementsHydratedRef = useRef(false)
  const perfectStartEligibleRef = useRef(true)
  const perfectStartCountRef = useRef(0)
  const perfectStartInitializedRef = useRef(false)
  const neverRepeatRef = useRef(true)
  const typoFreeRef = useRef(true)
  const hotStreakRef = useRef(0)
  const wrongStreakRef = useRef(0)
  const alreadyStreakRef = useRef(0)
  const lineMasterSyncRef = useRef(false)

  // Hydrate globally earned achievements so one-offs (e.g., comeback-kid) never re-award across cities
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('mm-achievements-earned')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          earnedAchievementsRef.current = new Set(
            parsed.filter((slug): slug is string => typeof slug === 'string'),
          )
        }
      }
    } catch {
      // ignore malformed storage
    }
    achievementsHydratedRef.current = true
  }, [])

  const normalizeString = useNormalizeString()
  const { featureCollection, clusterGroups, clusterMembersById } = useMemo(() => {
    const cityStationAliases = getCityStationAliases(CITY_NAME)
    const primaryNameOwners = new Map<string, Set<string>>()
    fc.features.forEach((feature) => {
      const name = typeof feature.properties.name === 'string' ? feature.properties.name : ''
      const key = normalizeString(name)
      if (!key) return
      const owners = primaryNameOwners.get(key) ?? new Set<string>()
      owners.add(name)
      primaryNameOwners.set(key, owners)
    })
    const hyphenSegmentOwners = new Map<string, Set<string>>()
    fc.features.forEach((feature) => {
      const name = typeof feature.properties.name === 'string' ? feature.properties.name : ''
      generateHyphenSegmentAlternates(name).forEach((alternate) => {
        const key = normalizeString(alternate)
        if (!key) return
        const owners = hyphenSegmentOwners.get(key) ?? new Set<string>()
        owners.add(name)
        hyphenSegmentOwners.set(key, owners)
      })
    })
    const streetSuffixAliasOwners = new Map<string, Set<string>>()
    fc.features.forEach((feature) => {
      const name = typeof feature.properties.name === 'string' ? feature.properties.name : ''
      generateStreetSuffixAlternates(name).forEach((alternate) => {
        const key = normalizeString(alternate)
        if (!key) return
        const owners = streetSuffixAliasOwners.get(key) ?? new Set<string>()
        owners.add(name)
        streetSuffixAliasOwners.set(key, owners)
      })
    })

    const collidesWithDifferentPrimaryName = (alias: string, originalName: string) => {
      const owners = primaryNameOwners.get(normalizeString(alias))
      if (!owners) return false
      return owners.size > 1 || !owners.has(originalName)
    }

    const collidesWithDifferentHyphenSegment = (alias: string, originalName: string) => {
      const owners = hyphenSegmentOwners.get(normalizeString(alias))
      if (!owners) return false
      return owners.size > 1 || !owners.has(originalName)
    }

    const collidesWithDifferentStreetSuffixAlias = (alias: string, originalName: string) => {
      const owners = streetSuffixAliasOwners.get(normalizeString(alias))
      if (!owners) return false
      return owners.size > 1 || !owners.has(originalName)
    }

    const featuresWithAlternates = fc.features.map((feature) => {
      const originalName =
        typeof feature.properties.name === 'string'
          ? feature.properties.name
          : ''

      const propertiesWithAlternates = feature.properties as typeof feature.properties & {
        alternate_names?: string[]
        line?: string
      }
      const lineId =
        typeof propertiesWithAlternates.line === 'string'
          ? propertiesWithAlternates.line
          : undefined

      const existingAlternates = Array.isArray(
        propertiesWithAlternates.alternate_names,
      )
        ? propertiesWithAlternates.alternate_names.filter(
            (alt): alt is string =>
              typeof alt === 'string' && alt.trim().length > 0,
          )
        : []

      const generatedAlternates = generateAlternateNames(originalName)
      const cityConfiguredAlternates = cityStationAliases[originalName] ?? []
      const streetSuffixAlternates = generateStreetSuffixAlternates(originalName)
      const ordinalAlternates = [
        originalName,
        ...existingAlternates,
        ...cityConfiguredAlternates,
        ...generatedAlternates,
      ].flatMap((value) => generateOrdinalNumberAlternates(value))
      const cityConfiguredAlternateKeys = new Set(
        cityConfiguredAlternates.map((alternate) => normalizeString(alternate)),
      )
      const streetSuffixAlternateKeys = new Set(
        streetSuffixAlternates.map((alternate) => normalizeString(alternate)),
      )
      const hyphenSegmentAlternates = generateHyphenSegmentAlternates(originalName).filter(
        (alternate) =>
          !collidesWithDifferentPrimaryName(alternate, originalName) &&
          !collidesWithDifferentHyphenSegment(alternate, originalName),
      )

      const amtrakAliasSource =
        CITY_NAME === 'amtrak'
          ? [originalName, ...existingAlternates, ...generatedAlternates]
          : []
      const stationlessAliasSource = [
        originalName,
        ...existingAlternates,
        ...generatedAlternates,
        ...cityConfiguredAlternates,
      ]
      const chineseNameContext = extractChineseStationNameContext(originalName)
      const englishifiedChineseStationAlternates = stationlessAliasSource
        .map((value) => normalizeChineseStationDisplayName(value, chineseNameContext))
        .filter(
          (value) =>
            value.trim().length > 0 && !stationlessAliasSource.includes(value),
        )
      const chineseDirectionalAlternates = stationlessAliasSource.flatMap((value) =>
        generateChineseDirectionalAlternates(value),
      )
      const stationlessAliasSourceWithDirectional = [
        ...stationlessAliasSource,
        ...englishifiedChineseStationAlternates,
        ...chineseDirectionalAlternates,
      ]
      const universityAlternates = stationlessAliasSourceWithDirectional.flatMap((value) =>
        generateUniversityStationAlternates(value),
      )
      const chineseStreetAlternates = [
        ...stationlessAliasSourceWithDirectional,
        ...universityAlternates,
      ].flatMap((value) => generateChineseStreetAlternates(value))
      const contextualChineseStreetAlternates =
        generateContextualChineseStreetAlternates([
          ...stationlessAliasSourceWithDirectional,
          ...universityAlternates,
          ...chineseStreetAlternates,
        ])

      const mergedAlternates = Array.from(
        new Set([
            ...existingAlternates,
            ...cityConfiguredAlternates,
            ...englishifiedChineseStationAlternates,
            ...chineseDirectionalAlternates,
            ...universityAlternates,
            ...chineseStreetAlternates,
            ...contextualChineseStreetAlternates,
            ...hyphenSegmentAlternates,
            ...streetSuffixAlternates,
            ...ordinalAlternates,
            ...generatedAlternates.filter(
              (alt) => typeof alt === 'string' && alt.trim().length > 0,
            ),
          ...[
            ...stationlessAliasSourceWithDirectional,
            ...universityAlternates,
            ...chineseStreetAlternates,
            ...contextualChineseStreetAlternates,
          ].flatMap((value) =>
            generateStationlessAlternates(value),
          ),
          ...(CITY_NAME === 'amtrak'
            ? AMTRAK_MANUAL_ALTERNATE_NAMES[originalName] ?? []
            : []),
          ...(CITY_NAME === 'amtrak'
            ? [
                ...amtrakAliasSource.flatMap((value) =>
                  generateStationlessAlternates(value),
                ),
              ]
            : []),
        ]),
      )
      const filteredAlternates = mergedAlternates.filter((alternate) => {
        if (CITY_NAME === 'amtrak') {
          const blockedAlternates =
            AMTRAK_BLOCKED_ALTERNATE_NAMES[originalName] ?? []
          if (
            blockedAlternates.some(
              (blockedAlternate) =>
                blockedAlternate.trim().toLowerCase() ===
                alternate.trim().toLowerCase(),
            )
          ) {
            return false
          }
        }
        if (CITY_NAME === 'nyc' || CITY_NAME === 'regional-rail') {
          if (
            (lineId === 'NewYorkSubwayE' ||
              lineId === 'NewYorkSubwayF' ||
              lineId === 'NewYorkSubwayFX') &&
            originalName === 'Forest Hills - 71 Av' &&
            /^forest hills$/i.test(alternate.trim())
          ) {
            return false
          }
          if (
            (lineId === 'NewYorkSubwayE' ||
              lineId === 'NewYorkSubwayF' ||
              lineId === 'NewYorkSubwayFX') &&
            originalName === 'Kew Gardens - Union Tpke' &&
            /^kew gardens$/i.test(alternate.trim())
          ) {
            return false
          }
          if (lineId === 'AirTrainEWR') {
            if (
              /^terminal [abc]$/i.test(originalName) &&
              /\bterminal\s*[1-8]\b/i.test(alternate)
            ) {
              return false
            }
          }
        }
        if (
          streetSuffixAlternateKeys.has(normalizeString(alternate)) &&
          !cityConfiguredAlternateKeys.has(normalizeString(alternate)) &&
          collidesWithDifferentStreetSuffixAlias(alternate, originalName)
        ) {
          return false
        }
        return true
      })

      const nextProperties: typeof feature.properties & {
        alternate_names?: string[]
      } = {
        ...feature.properties,
        name:
          typeof feature.properties.name === 'string'
            ? formatLocalizedStationDisplayName(
                normalizeChineseStationDisplayName(feature.properties.name),
                settings.language,
              )
            : feature.properties.name,
        display_name:
          typeof feature.properties.display_name === 'string'
            ? formatLocalizedStationDisplayName(
                normalizeChineseStationDisplayName(feature.properties.display_name),
                settings.language,
              )
            : feature.properties.display_name,
        long_name:
          typeof feature.properties.long_name === 'string'
            ? formatLocalizedStationDisplayName(
                normalizeChineseStationDisplayName(feature.properties.long_name),
                settings.language,
              )
            : feature.properties.long_name,
        short_name:
          typeof feature.properties.short_name === 'string'
            ? formatLocalizedStationDisplayName(
                normalizeChineseStationDisplayName(feature.properties.short_name),
                settings.language,
              )
            : feature.properties.short_name,
      }

      if (filteredAlternates.length > 0) {
        nextProperties.alternate_names = filteredAlternates
      } else if ('alternate_names' in nextProperties) {
        delete nextProperties.alternate_names
      }

      return {
        ...feature,
        properties: nextProperties,
      } as DataFeature
    })

    type PointFeatureEntry = {
      feature: DataFeature
      id: number
      lng: number
      lat: number
      name: string
      autoClusterAliases: Set<string>
    }

    const pointFeatures: PointFeatureEntry[] = featuresWithAlternates
      .map((feature) => {
        if (
          feature.geometry?.type !== 'Point' ||
          !Array.isArray(feature.geometry.coordinates) ||
          typeof feature.id !== 'number'
        ) {
          return null
        }

        const [lng, lat] = feature.geometry.coordinates as number[]
        return {
          feature,
          id: feature.id as number,
          lng,
          lat,
          name: (feature.properties.name ?? '').trim(),
          autoClusterAliases: buildAutoClusterAliases(feature, normalizeString),
        }
      })
      .filter((entry): entry is PointFeatureEntry => entry !== null)

    const parent = new Map<number, number>()

    const find = (id: number): number => {
      const current = parent.get(id)
      if (current === undefined) {
        parent.set(id, id)
        return id
      }
      if (current === id) {
        return id
      }
      const root = find(current)
      parent.set(id, root)
      return root
    }

    const union = (a: number, b: number) => {
      const rootA = find(a)
      const rootB = find(b)
      if (rootA === rootB) {
        return
      }
      if (rootA < rootB) {
        parent.set(rootB, rootA)
      } else {
        parent.set(rootA, rootB)
      }
    }

    const COMPLEX_THRESHOLD = 0.00075

    const explicitClusterMembers = new Map<string | number, number[]>()

    const matchesManualSelector = (
      entry: PointFeatureEntry,
      selector: ManualComplexSelector,
    ) => featureMatchesManualComplexSelector(entry.feature, selector)

    const isAutoComplexExcluded = (
      current: PointFeatureEntry,
      other: PointFeatureEntry,
    ) =>
      MANUAL_AUTO_COMPLEX_EXCLUSIONS.some(
        ([first, second]) =>
          (matchesManualSelector(current, first) &&
            matchesManualSelector(other, second)) ||
          (matchesManualSelector(current, second) &&
            matchesManualSelector(other, first)),
      )

    pointFeatures.forEach((entry) => {
      const propertiesWithCluster = entry.feature.properties as typeof entry.feature.properties & {
        cluster_key?: number | string
      }

      const clusterKey = propertiesWithCluster?.cluster_key
      const normalizedKey =
        typeof clusterKey === 'string' ? clusterKey.trim() : clusterKey

      if (normalizedKey === undefined || normalizedKey === null || normalizedKey === '') {
        return
      }

      const members = explicitClusterMembers.get(normalizedKey) ?? []
      members.push(entry.id)
      explicitClusterMembers.set(normalizedKey, members)
    })

    explicitClusterMembers.forEach((members) => {
      if (members.length <= 1) {
        return
      }

      const [first, ...rest] = members
      rest.forEach((id) => union(first, id))
    })

    for (let i = 0; i < pointFeatures.length; i++) {
      const current = pointFeatures[i]
      for (let j = i + 1; j < pointFeatures.length; j++) {
        const other = pointFeatures[j]
        const distance = Math.hypot(current.lng - other.lng, current.lat - other.lat)
        if (
          distance <= COMPLEX_THRESHOLD &&
          !isAutoComplexExcluded(current, other) &&
          autoClusterAliasSetsOverlap(
            current.autoClusterAliases,
            other.autoClusterAliases,
          )
        ) {
          union(current.id, other.id)
        }
      }
    }

    const pointFeaturesByName = new Map<string, PointFeatureEntry[]>()
    pointFeatures.forEach((entry) => {
      const key = entry.name.trim().toLowerCase()
      if (!key) {
        return
      }
      if (!pointFeaturesByName.has(key)) {
        pointFeaturesByName.set(key, [])
      }
      pointFeaturesByName.get(key)!.push(entry)
    })

    const collectMatches = (selector: ManualComplexSelector) => {
      const key = selector.name.trim().toLowerCase()
      const candidates = pointFeaturesByName.get(key) ?? []
      return candidates.filter((entry) => matchesManualSelector(entry, selector))
    }

    MANUAL_COMPLEX_GROUPS.forEach((group) => {
      const memberIds = new Set<number>()
      group.forEach((selector) => {
        collectMatches(selector).forEach((entry) => memberIds.add(entry.id))
      })
      const ids = Array.from(memberIds)
      if (ids.length <= 1) {
        return
      }
      const [first, ...rest] = ids
      rest.forEach((id) => union(first, id))
    })

    const clusters = new Map<number, PointFeatureEntry[]>()
    pointFeatures.forEach((entry) => {
      const root = find(entry.id)
      if (!clusters.has(root)) {
        clusters.set(root, [])
      }
      clusters.get(root)!.push(entry)
    })

    const clusterKeyById = new Map<number, number>()
    const additionalAlternateNames = new Map<number, Set<string>>()
    const clusterGroups = new Map<number, number[]>()

    clusters.forEach((members, root) => {
      if (members.length <= 1) {
        return
      }

      const clusterIds = members
        .map((member) => member.id)
        .filter((id): id is number => typeof id === 'number')
      if (clusterIds.length > 1) {
        clusterGroups.set(root, clusterIds)
      }

      const uniqueNames = Array.from(
        new Set(
          members
            .map((member) => member.name)
            .filter((name): name is string => name.length > 0),
        ),
      )

      const globalAlias =
        uniqueNames.length > 1 ? uniqueNames.join(' - ') : undefined

      members.forEach((member) => {
        const memberId = member.id
        clusterKeyById.set(memberId, root)

        if (uniqueNames.length <= 1) {
          return
        }

        const additionalAlternates =
          additionalAlternateNames.get(memberId) ?? new Set<string>()

        const memberName = member.name
        const sortedOthers = uniqueNames
          .filter((name) => name !== memberName)
          .sort((a, b) => a.localeCompare(b))

        if (globalAlias && globalAlias !== memberName) {
          additionalAlternates.add(globalAlias)
        }

        if (memberName && sortedOthers.length > 0) {
          additionalAlternates.add([memberName, ...sortedOthers].join(' - '))
        }

        additionalAlternateNames.set(memberId, additionalAlternates)
      })
    })

    const clusterMembersById = new Map<number, number[]>()

    clusterGroups.forEach((members) => {
      members.forEach((memberId) => {
        clusterMembersById.set(memberId, members)
      })
    })

    const finalFeatures = featuresWithAlternates.map((feature) => {
      const id = feature.id
      if (typeof id !== 'number') {
        return feature
      }

      const propertiesWithExtras = feature.properties as typeof feature.properties & {
        alternate_names?: string[]
        cluster_key?: number | string
      }

      const baseAlternates = Array.isArray(propertiesWithExtras.alternate_names)
        ? propertiesWithExtras.alternate_names.filter(
            (alt): alt is string =>
              typeof alt === 'string' && alt.trim().length > 0,
          )
        : []

      const extraAlternates = additionalAlternateNames.get(id)
      const mergedAlternates = Array.from(
        new Set([
          ...baseAlternates,
          ...(extraAlternates ? Array.from(extraAlternates) : []),
        ]),
      )

      const nextProperties: typeof propertiesWithExtras = {
        ...feature.properties,
      }

      if (mergedAlternates.length > 0) {
        nextProperties.alternate_names = mergedAlternates
      } else if ('alternate_names' in nextProperties) {
        delete nextProperties.alternate_names
      }

      const clusterKey = clusterKeyById.get(id)
      if (clusterKey !== undefined && clusterKey !== null) {
        nextProperties.cluster_key = clusterKey
      } else if ('cluster_key' in nextProperties) {
        delete nextProperties.cluster_key
      }

      return {
        ...feature,
        properties: nextProperties,
      } as DataFeature
    })

    return {
      featureCollection: {
        ...fc,
        features: finalFeatures,
      },
      clusterGroups,
      clusterMembersById,
    }
  }, [CITY_NAME, fc, normalizeString, settings.language])

  const displayLines = LINES

  const displayRoutes = useMemo(
    () => applyCityRouteOverrides(routes, CITY_NAME),
    [routes, CITY_NAME],
  )

  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('default')
  const usingAmapMapStyle = mapStyleMode === 'amap'
  const amapFeatureCacheKey = useMemo(
    () => `features:${cityPath ?? CITY_NAME}:${settings.language}`,
    [CITY_NAME, cityPath, settings.language],
  )
  const amapRouteCacheKey = useMemo(
    () => `routes:${cityPath ?? CITY_NAME}`,
    [CITY_NAME, cityPath],
  )

  const renderFeatureCollection = useMemo(
    () =>
      usingAmapMapStyle
        ? transformFeatureCollectionForAmapCached(amapFeatureCacheKey, featureCollection)
        : featureCollection,
    [amapFeatureCacheKey, featureCollection, usingAmapMapStyle],
  )

  const mergedDisplayRoutes = useMemo(
    () => (displayRoutes ? mergeRoutePieces(displayRoutes) : displayRoutes),
    [displayRoutes],
  )
  const renderDisplayRoutes = useMemo(
    () =>
      mergedDisplayRoutes
        ? usingAmapMapStyle
          ? transformFeatureCollectionForAmapCached(amapRouteCacheKey, mergedDisplayRoutes)
          : mergedDisplayRoutes
        : mergedDisplayRoutes,
    [amapRouteCacheKey, mergedDisplayRoutes, usingAmapMapStyle],
  )

  const renderCullingEnabled = Boolean(
    MAP_FROM_DATA && MAP_RENDER_CULLING?.enabled && renderDisplayRoutes,
  )
  const renderCullingPaddingFactor = MAP_RENDER_CULLING?.paddingFactor ?? 0.5

  const stationRenderEntries = useMemo(
    () =>
      renderFeatureCollection.features
        .map((feature) => ({
          feature,
          bounds: getFeatureBounds(feature),
        }))
        .filter(
          (
            entry,
          ): entry is {
            feature: DataFeature
            bounds: RenderBounds
          } => entry.bounds !== null,
        ),
    [renderFeatureCollection.features],
  )

  const routeRenderEntries = useMemo(
    () =>
      (renderDisplayRoutes?.features ?? [])
        .map((feature) => ({
          feature,
          bounds: getFeatureBounds(feature),
        }))
        .filter(
          (
            entry,
          ): entry is {
            feature: RoutesFeatureCollection['features'][number]
            bounds: RenderBounds
          } => entry.bounds !== null,
        ),
    [renderDisplayRoutes],
  )

  const getRenderedCollections = useCallback(
    (mapBounds: RenderBounds) => {
      if (!renderCullingEnabled) {
        return {
          features: renderFeatureCollection,
          routes: renderDisplayRoutes ?? EMPTY_ROUTES_FEATURE_COLLECTION,
        }
      }

      const expandedBounds = expandRenderBounds(
        mapBounds,
        renderCullingPaddingFactor,
      )

      return {
        features: {
          ...renderFeatureCollection,
          features: stationRenderEntries
            .filter((entry) => intersectsRenderBounds(entry.bounds, expandedBounds))
            .map((entry) => entry.feature),
        } as DataFeatureCollection,
        routes: renderDisplayRoutes
          ? ({
              ...renderDisplayRoutes,
              features: routeRenderEntries
                .filter((entry) => intersectsRenderBounds(entry.bounds, expandedBounds))
                .map((entry) => entry.feature),
            } as RoutesFeatureCollection)
          : EMPTY_ROUTES_FEATURE_COLLECTION,
      }
    },
    [
      renderDisplayRoutes,
      renderFeatureCollection,
      renderCullingEnabled,
      renderCullingPaddingFactor,
      routeRenderEntries,
      stationRenderEntries,
    ],
  )

  const allStationIds = useMemo(() => {
    const ids = featureCollection.features
      .map((feature) => feature.id)
      .filter((id): id is number => typeof id === 'number')
    return Array.from(new Set(ids))
  }, [featureCollection.features])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const total = allStationIds.length
    const storageKey = `${CITY_NAME}-station-total`

    try {
      if (total <= 0) {
        window.localStorage.removeItem(storageKey)
        return
      }

      const stored = Number(window.localStorage.getItem(storageKey))
      if (!Number.isFinite(stored) || stored !== total) {
        window.localStorage.setItem(storageKey, String(total))
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Unable to persist station total for ${CITY_NAME}`, error)
      }
    }
  }, [CITY_NAME, allStationIds])

  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [mapBearing, setMapBearing] = useState(0)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { hideLabels, setHideLabels } = useHideLabels(map)
  const { user, updateProgressSummary, uiPreferences, updateUiPreferences } = useAuth()
  const [solutionsPromptOpen, setSolutionsPromptOpen] = useState(false)
  const [solutionsPassword, setSolutionsPassword] = useState('')
  const [solutionsAccessPassword, setSolutionsAccessPassword] = useState('')
  const [solutionsError, setSolutionsError] = useState(false)
  const [solutionsUnlocked, setSolutionsUnlocked] = useState(false)
  const [showSatellite, setShowSatellite] = useState(false)
  const [showMapNames, setShowMapNames] = useState(false)
  const [actionType, setActionType] = useState<'solutions' | 'satellite' | 'mapNames' | null>(null)
  const pendingActionRef = useRef<(() => void) | null>(null)
  const satelliteHydratedRef = useRef(false)
  const mapNamesHydratedRef = useRef(false)
  const mapCoordsToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canCopyMapCoords = showSatellite || showMapNames
  const { value: storedSidebarOpen, set: setStoredSidebarOpen } =
    useLocalStorageValue<boolean>(`${CITY_NAME}-sidebar-open`, {
      defaultValue: true,
      initializeWithValue: false,
    })
  const [sidebarOpenState, setSidebarOpenState] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const sidebarScrollRef = useRef<HTMLDivElement | null>(null)
  const [sidebarScrolled, setSidebarScrolled] = useState(false)
  const [activeFoundId, setActiveFoundId] = useState<number | null>(null)
  const [achievementToast, setAchievementToast] = useState<AchievementToastState | null>(null)
  const [mapCoordsMenu, setMapCoordsMenu] = useState<MapCoordsMenuState | null>(null)
  const [mapCoordsToast, setMapCoordsToast] = useState<string | null>(null)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [cityStatsOpen, setCityStatsOpen] = useState(false)
  const [missedGuessInputsOpen, setMissedGuessInputsOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showMapFallbackPreview, setShowMapFallbackPreview] = useState(false)
  const [offlineDownloadStatus, setOfflineDownloadStatus] = useState<
    'idle' | 'downloading' | 'downloaded' | 'error'
  >('idle')
  const [offlineDownloadError, setOfflineDownloadError] = useState<string | null>(null)
  // Started without a connection: draw the lines on a plain background instead
  // of waiting for map tiles that cannot load.
  const [startedOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  )
  const [mapStyleModeReady, setMapStyleModeReady] = useState(false)
  const [mapRetryNonce, setMapRetryNonce] = useState(0)
  const mapStylePreferenceRef = useRef<MapStyleMode | null>(null)
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null)
  const disableRouteLineHighlightInteraction =
    CITY_NAME === 'nyc' || CITY_NAME === 'amtrak'
  const foundRef = useRef<number[]>([])

  const mapViewStorageKey = useMemo(
    () => getMapViewStorageKey(CITY_NAME, mapStyleMode),
    [CITY_NAME, mapStyleMode],
  )

  useEffect(() => {
    if (solutionsPromptOpen || resetConfirmOpen || mobileSidebarOpen) {
      return
    }
    if (!shouldRestoreMainInputFocus(inputRef.current)) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mobileSidebarOpen, resetConfirmOpen, solutionsPromptOpen])
  // Hydrate saved map view (local only)
  useEffect(() => {
    if (!mapStyleModeReady || typeof window === 'undefined') return
    savedMapViewRef.current = null
    if (isCustomWorldMap) return
    try {
      const raw = window.localStorage.getItem(mapViewStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (isStoredMapView(parsed)) {
          savedMapViewRef.current = parsed
        } else {
          window.localStorage.removeItem(mapViewStorageKey)
        }
      }
    } catch {
      // ignore
    }
  }, [isCustomWorldMap, mapStyleModeReady, mapViewStorageKey])

  useEffect(() => {
    if (highlightedLineId) {
        const timer = setTimeout(() => {
            setHighlightedLineId(null)
        }, 5000)
        return () => clearTimeout(timer)
    }
  }, [highlightedLineId])

  useEffect(() => {
    let nextSatellite = showSatellite

    if (typeof uiPreferences.cityViewSatellite === 'boolean') {
      nextSatellite = uiPreferences.cityViewSatellite
    } else if (!satelliteHydratedRef.current && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(GLOBAL_SATELLITE_STORAGE_KEY)
      if (stored === '1' || stored === 'true') {
        nextSatellite = true
      } else if (stored === '0' || stored === 'false') {
        nextSatellite = false
      }
    }

    if (nextSatellite !== showSatellite) {
      setShowSatellite(nextSatellite)
    }

    if (!satelliteHydratedRef.current) {
      satelliteHydratedRef.current = true
    }
  }, [showSatellite, uiPreferences.cityViewSatellite])

  useEffect(() => {
    if (!satelliteHydratedRef.current) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        GLOBAL_SATELLITE_STORAGE_KEY,
        showSatellite ? '1' : '0',
      )
    }
    updateUiPreferences({ cityViewSatellite: showSatellite })
  }, [showSatellite, updateUiPreferences])

  useEffect(() => {
    let nextMapNames = showMapNames

    if (!mapNamesHydratedRef.current && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(GLOBAL_MAP_NAMES_STORAGE_KEY)
      if (stored === '1' || stored === 'true') {
        nextMapNames = true
      } else if (stored === '0' || stored === 'false') {
        nextMapNames = false
      }
    }

    if (nextMapNames !== showMapNames) {
      setShowMapNames(nextMapNames)
    }

    if (!mapNamesHydratedRef.current) {
      mapNamesHydratedRef.current = true
    }
  }, [showMapNames])

  useEffect(() => {
    if (solutionsUnlocked || typeof window === 'undefined') {
      return
    }

    if (
      readSolutionsAccess() ||
      (satelliteHydratedRef.current && showSatellite) ||
      (mapNamesHydratedRef.current && showMapNames)
    ) {
      setSolutionsUnlocked(true)
    }
  }, [showMapNames, showSatellite, solutionsUnlocked])

  useEffect(() => {
    if (!mapNamesHydratedRef.current) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        GLOBAL_MAP_NAMES_STORAGE_KEY,
        showMapNames ? '1' : '0',
      )
    }
  }, [showMapNames])
  const completionConfettiStorageKey = useMemo(
    () => `${CITY_NAME}-completion-confetti-shown`,
    [CITY_NAME],
  )
  const [cityCompletionConfettiSeen, setCityCompletionConfettiSeen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      setCityCompletionConfettiSeen(
        window.localStorage.getItem(completionConfettiStorageKey) === '1',
      )
    } catch {
      setCityCompletionConfettiSeen(false)
    }
  }, [completionConfettiStorageKey])

  const markCityCompletionConfettiSeen = useCallback(() => {
    setCityCompletionConfettiSeen(true)
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(completionConfettiStorageKey, '1')
    } catch {
      // ignore storage errors
    }
  }, [completionConfettiStorageKey])

  useEffect(() => {
    if (typeof storedSidebarOpen === 'boolean') {
      setSidebarOpenState(storedSidebarOpen)
    }
  }, [storedSidebarOpen])

  useEffect(() => {
    let cancelled = false

    const applyResolvedMode = (nextMapStyleMode: MapStyleMode) => {
      if (cancelled) {
        return
      }
      setMapStyleMode(nextMapStyleMode)
      setMapStyleModeReady(true)
      setMapRetryNonce(0)
      setMapError(null)
      setShowMapFallbackPreview(false)
      mapUnavailableRef.current = false
    }

    const resolveMapStyleMode = async () => {
      if (typeof window === 'undefined') {
        applyResolvedMode(requestInMainlandChina ? 'amap' : 'default')
        return
      }

      window.localStorage.removeItem(getMapStyleModeStorageKey(CITY_NAME))
      const stored = window.localStorage.getItem(
        getMapStylePreferenceStorageKey(CITY_NAME),
      )
      if (stored === 'amap' || stored === 'default') {
        mapStylePreferenceRef.current = stored
        applyResolvedMode(stored)
        return
      }

      mapStylePreferenceRef.current = null

      applyResolvedMode(requestInMainlandChina ? 'amap' : 'default')
    }

    void resolveMapStyleMode()

    return () => {
      cancelled = true
    }
  }, [CITY_NAME, requestInMainlandChina])

  const setSidebarOpen = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setSidebarOpenState((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (prev: boolean) => boolean)(prev) : next
        setStoredSidebarOpen(resolved)
        return resolved
      })
    },
    [setStoredSidebarOpen],
  )

  const handleRetryMap = useCallback(
    (
      mode: 'current' | 'amap' = 'current',
      options?: { persistPreference?: boolean },
    ) => {
      const nextMode = mode === 'amap' ? 'amap' : 'default'
      mapUnavailableRef.current = false
      setMap(null)
      setMapError(null)
      setShowMapFallbackPreview(false)
      setMapStyleMode(nextMode)
      if (options?.persistPreference && typeof window !== 'undefined') {
        mapStylePreferenceRef.current = nextMode
        window.localStorage.setItem(
          getMapStylePreferenceStorageKey(CITY_NAME),
          nextMode,
        )
      }
      setMapRetryNonce((prev) => prev + 1)
    },
    [CITY_NAME],
  )

  const sidebarOpen = sidebarOpenState

  useEffect(() => {
    if (!map) {
      return
    }

    setShowMapFallbackPreview(false)
    setMapError(null)
  }, [map])

  useEffect(() => {
    const el = sidebarScrollRef.current
    if (!el) {
      setSidebarScrolled(false)
      return
    }
    const onScroll = () => setSidebarScrolled(el.scrollTop > 120)
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [sidebarOpen])

  const scrollSidebarToTop = useCallback(() => {
    sidebarScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleAchievementToastClose = useCallback(() => {
    setAchievementToast(null)
  }, [])

  const handleAchievementToastNever = useCallback((slug: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(achievementToastStorageKey(slug), '1')
      } catch {
        // ignore storage errors
      }
    }
    setAchievementToast(null)
  }, [])

  const closeMapCoordsMenu = useCallback(() => {
    setMapCoordsMenu(null)
  }, [])

  const showMapCoordsCopiedToast = useCallback((message: string) => {
    if (mapCoordsToastTimeoutRef.current) {
      clearTimeout(mapCoordsToastTimeoutRef.current)
    }
    setMapCoordsToast(message)
    mapCoordsToastTimeoutRef.current = setTimeout(() => {
      setMapCoordsToast(null)
      mapCoordsToastTimeoutRef.current = null
    }, MAP_COORDS_TOAST_DISMISS_MS)
  }, [])

  const copyMapCoords = useCallback(async () => {
    if (!mapCoordsMenu) return
    const lat = mapCoordsMenu.lat.toFixed(7)
    const lng = mapCoordsMenu.lng.toFixed(7)
    const text = lat + ', ' + lng

    try {
      const copied = await copyTextToClipboard(text)
      showMapCoordsCopiedToast(copied ? 'Copied ' + text : 'Copy unavailable: ' + text)
    } catch {
      showMapCoordsCopiedToast('Copy failed: ' + text)
    } finally {
      closeMapCoordsMenu()
    }
  }, [closeMapCoordsMenu, mapCoordsMenu, showMapCoordsCopiedToast])

  const customSharePath = useMemo(() => {
    if (!isCustomGame) {
      return null
    }

    return pathname + (searchParamsString ? '?' + searchParamsString : '')
  }, [isCustomGame, pathname, searchParamsString])

  const shareCustomMap = useCallback(async () => {
    if (!customSharePath || typeof window === 'undefined') {
      return
    }

    const shareUrl = new URL(customSharePath, window.location.origin).toString()
    const shareTitle = document.title || 'Metro Memory custom map'

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: 'Play this custom map on Metro Memory.',
          url: shareUrl,
        })
        showMapCoordsCopiedToast('Shared custom map')
        return
      }

      const copied = await copyTextToClipboard(shareUrl)
      showMapCoordsCopiedToast(copied ? 'Copied custom map link' : 'Copy unavailable: ' + shareUrl)
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }
      showMapCoordsCopiedToast('Copy failed: ' + shareUrl)
    }
  }, [customSharePath, showMapCoordsCopiedToast])

  useEffect(() => {
    if (!mapCoordsMenu) return

    const handlePointerDown = () => {
      setMapCoordsMenu(null)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMapCoordsMenu(null)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [mapCoordsMenu])

  useEffect(() => {
    if (canCopyMapCoords) return
    setMapCoordsMenu(null)
  }, [canCopyMapCoords])

  useEffect(() => {
    return () => {
      if (mapCoordsToastTimeoutRef.current) {
        clearTimeout(mapCoordsToastTimeoutRef.current)
      }
    }
  }, [])

  const openSettingsModal = useCallback(() => setSettingsModalOpen(true), [])
  const closeSettingsModal = useCallback(() => setSettingsModalOpen(false), [])
  const openAccountModal = useCallback(() => setAccountModalOpen(true), [])
  const closeAccountModal = useCallback(() => setAccountModalOpen(false), [])
  const openPrivacyModal = useCallback(() => setPrivacyModalOpen(true), [])
  const closePrivacyModal = useCallback(() => setPrivacyModalOpen(false), [])

  const idMap = useMemo(() => {
    const map = new Map<number, DataFeature>()
    featureCollection.features.forEach((feature) => {
      map.set(feature.id! as number, feature)
    })
    return map
  }, [featureCollection.features])

  const renderIdMap = useMemo(() => {
    const map = new Map<number, DataFeature>()
    renderFeatureCollection.features.forEach((feature) => {
      map.set(feature.id! as number, feature)
    })
    return map
  }, [renderFeatureCollection.features])

  const stationsPerLine = useMemo(() => {
    const lineMap = new Map<string, Set<string>>()
    for (let feature of featureCollection.features) {
      const line = feature.properties.line
      if (!line) {
        continue
      }
      const key = getStationKey(feature)
      if (!lineMap.has(line)) {
        lineMap.set(line, new Set<string>())
      }
      lineMap.get(line)!.add(key)
    }

    const result: Record<string, number> = {}
    lineMap.forEach((keys, line) => {
      result[line] = keys.size
    })
    return result
  }, [featureCollection.features])

  const { value: localFound, set: setStoredFound } = useLocalStorageValue<
    number[] | null
  >(`${progressScopeSlug}-stations`, {
    defaultValue: null,
    initializeWithValue: false,
  })

  const {
    value: storedFoundTimestampsRaw,
    set: setStoredFoundTimestamps,
  } = useLocalStorageValue<Record<string, string> | null>(
    `${progressScopeSlug}-stations-found-at`,
    {
      defaultValue: null,
      initializeWithValue: false,
    },
  )

  const storedFoundTimestamps: Record<string, string> | null =
    storedFoundTimestampsRaw ?? null

  const { value: storedIsNewPlayer, set: setStoredIsNewPlayer } =
    useLocalStorageValue<boolean>(`${progressScopeSlug}-stations-is-new-player`, {
      defaultValue: true,
      initializeWithValue: false,
    })

  const mergeScopeFoundIds = useCallback(
    (nextVisibleFound: number[], scopeSource?: number[] | null) => {
      const seen = new Set<number>()
      const merged: number[] = []

      ;(scopeSource ?? localFound ?? []).forEach((id) => {
        if (idMap.has(id) || seen.has(id)) {
          return
        }
        seen.add(id)
        merged.push(id)
      })

      nextVisibleFound.forEach((id) => {
        if (!idMap.has(id) || seen.has(id)) {
          return
        }
        seen.add(id)
        merged.push(id)
      })

      return merged
    },
    [idMap, localFound],
  )

  const setFound = useCallback(
    (nextFound: number[]) => {
      if (nextFound.length === 0) {
        setStoredFound([])
        return
      }
      setStoredFound(mergeScopeFoundIds(nextFound))
    },
    [mergeScopeFoundIds, setStoredFound],
  )

  const foundTimestamps = storedFoundTimestamps ?? EMPTY_TIMESTAMPS

  const [siblingMiniCityStationIds, setSiblingMiniCityStationIds] = useState<
    Record<string, Set<number>>
  >({})

  const setFoundTimestamps = useCallback(
    (updater: (prev: Record<string, string>) => Record<string, string>) => {
      setStoredFoundTimestamps((prev) => updater(prev ?? {}))
    },
    [setStoredFoundTimestamps],
  )

  const isNewPlayer = storedIsNewPlayer

  const setIsNewPlayer = useCallback(
    (nextValue: boolean) => {
      setStoredIsNewPlayer(nextValue)
    },
    [setStoredIsNewPlayer],
  )

  const found: number[] = useMemo(() => {
    const activeFound = localFound || []
    return activeFound.filter((f) => idMap.has(f))
  }, [idMap, localFound])
  const scopeFound: number[] = useMemo(
    () => localFound || [],
    [localFound],
  )

  useEffect(() => {
    foundRef.current = found
  }, [found])

  // Stations (or lines) added after a player found a station: count every
  // station that a guess for it would have counted too (same transfer group,
  // or the same station name), so saved progress picks up new transfers.
  const sameStationIdsById = useMemo(() => {
    const byName = new Map<string, number[]>()
    idMap.forEach((feature, id) => {
      const name = (feature.properties?.name ?? '').trim().toLowerCase()
      if (!name) return
      const ids = byName.get(name)
      if (ids) ids.push(id)
      else byName.set(name, [id])
    })
    const result = new Map<number, number[]>()
    idMap.forEach((feature, id) => {
      const name = (feature.properties?.name ?? '').trim().toLowerCase()
      const ids = new Set<number>([
        ...(clusterMembersById.get(id) ?? []),
        ...(name ? byName.get(name) ?? [] : []),
      ])
      ids.delete(id)
      if (ids.size > 0) result.set(id, Array.from(ids))
    })
    return result
  }, [clusterMembersById, idMap])

  useEffect(() => {
    if (!localFound || found.length === 0) return
    const foundSet = new Set(found)
    const sourceById = new Map<number, number>()
    for (const id of found) {
      for (const other of sameStationIdsById.get(id) ?? []) {
        if (!foundSet.has(other) && !sourceById.has(other)) {
          sourceById.set(other, id)
        }
      }
    }
    if (sourceById.size === 0) return
    setFound([...found, ...sourceById.keys()])
    setFoundTimestamps((prev) => {
      const next = { ...prev }
      sourceById.forEach((sourceId, id) => {
        const key = String(id)
        if (!next[key]) {
          next[key] = prev[String(sourceId)] ?? new Date().toISOString()
        }
      })
      return next
    })
  }, [found, localFound, sameStationIdsById, setFound, setFoundTimestamps])

  useEffect(() => {
    if (miniCityLinks?.mode !== 'child') {
      setSiblingMiniCityStationIds({})
      return
    }

    const siblingSlugs = miniCityLinks.siblings
      .map((miniCity) => miniCity.slug)
      .filter((slug) => slug !== CITY_NAME)

    if (siblingSlugs.length === 0) {
      setSiblingMiniCityStationIds({})
      return
    }

    setSiblingMiniCityStationIds({})

    let cancelled = false

    Promise.all(
      siblingSlugs.map(async (slug) => [slug, await loadMiniCityStationIdSet(slug)] as const),
    )
      .then((entries) => {
        if (cancelled) {
          return
        }
        setSiblingMiniCityStationIds(Object.fromEntries(entries))
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Unable to load sibling mini-city station ids', error)
        }
      })

    return () => {
      cancelled = true
    }
  }, [CITY_NAME, miniCityLinks])

  const reapplyFoundFeatureState = useCallback(
    (targetMap: mapboxgl.Map) => {
      if (!targetMap.getSource('features')) {
        return
      }

      targetMap.removeFeatureState({ source: 'features' })

      for (let id of foundRef.current) {
        targetMap.setFeatureState({ source: 'features', id }, { found: true })
      }
    },
    [],
  )

  const refreshRenderedSources = useCallback(
    (targetMap: mapboxgl.Map, boundsOverride?: RenderBounds) => {
      if (!renderCullingEnabled) {
        return
      }

      const { features, routes: renderedRoutes } = getRenderedCollections(
        boundsOverride ?? getMapBoundsTuple(targetMap.getBounds()),
      )

      const featuresSource = targetMap.getSource('features') as
        | mapboxgl.GeoJSONSource
        | undefined

      if (featuresSource) {
        featuresSource.setData(features)
      }

      const routesSource = targetMap.getSource('game-routes') as
        | mapboxgl.GeoJSONSource
        | undefined

      if (routesSource) {
        routesSource.setData(renderedRoutes)
      }

      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          reapplyFoundFeatureState(targetMap)
        })
      } else {
        reapplyFoundFeatureState(targetMap)
      }
    },
    [getRenderedCollections, reapplyFoundFeatureState, renderCullingEnabled],
  )

  const zoomToFeatures = useCallback(
    (ids: number[]) => {
      if (!map || ids.length === 0) {
        return
      }

      const uniqueStationKeys = new Set<string>()
      const validIds: number[] = []

      ids.forEach((id) => {
        const feature = renderIdMap.get(id)
        if (!feature) {
          return
        }
        validIds.push(id)
        uniqueStationKeys.add(getStationKey(feature))
      })

      if (validIds.length === 0) {
        return
      }

      if (uniqueStationKeys.size === 1) {
        const primaryId = validIds.find((id) => {
          const feature = renderIdMap.get(id)
          return feature?.geometry?.type === 'Point'
        }) ?? validIds[0]

        const primaryFeature = renderIdMap.get(primaryId)
        if (!primaryFeature) {
          return
        }

        if (primaryFeature.geometry.type === 'Point') {
          map.easeTo({
            center: primaryFeature.geometry.coordinates as [number, number],
            zoom: 14,
            duration: 900,
            essential: true,
          })
          return
        }
      }

      const coords: [number, number][] = []

      validIds.forEach((id) => {
        const feature = renderIdMap.get(id)
        if (!feature) {
          return
        }

        coordEach(feature, (coord) => {
          if (
            Array.isArray(coord) &&
            coord.length >= 2 &&
            Number.isFinite(coord[0]) &&
            Number.isFinite(coord[1])
          ) {
            coords.push([coord[0], coord[1]])
          }
        })
      })

      if (coords.length === 0) {
        return
      }

      const center = coords.reduce<[number, number]>(
        (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
        [0, 0],
      )

      const averagedCenter: [number, number] = [
        center[0] / coords.length,
        center[1] / coords.length,
      ]

      map.easeTo({
        center: averagedCenter,
        zoom: coords.length > 1 ? 13.5 : 14,
        duration: 900,
        essential: true,
      })
    },
    [map, renderIdMap],
  )

  const localFoundRef = useRef<number[] | null>(null)
  const localTimestampsRef = useRef<Record<string, string> | null>(null)

  useEffect(() => {
    localFoundRef.current = Array.isArray(localFound) ? [...localFound] : null
  }, [localFound])

  useEffect(() => {
    localTimestampsRef.current = storedFoundTimestamps
  }, [storedFoundTimestamps])

  useEffect(() => {
    if (!Array.isArray(localFound)) {
      return
    }

    const hidden = localFound.filter((id) => !idMap.has(id))
    const visible = localFound.filter((id) => idMap.has(id))
    const visibleSet = new Set<number>()
    const expandedVisible: number[] = []

    const addVisibleId = (id: number) => {
      if (!idMap.has(id) || visibleSet.has(id)) {
        return
      }
      visibleSet.add(id)
      expandedVisible.push(id)
    }

    visible.forEach((id) => {
      addVisibleId(id)
      const clusterMembers = clusterMembersById.get(id)
      if (clusterMembers && clusterMembers.length > 0) {
        clusterMembers.forEach(addVisibleId)
      }
    })

    const expanded = [...hidden, ...expandedVisible]
    const hasDifference =
      expanded.length !== localFound.length ||
      expanded.some((id) => !localFound.includes(id))

    if (hasDifference) {
      setStoredFound(expanded)
    }
  }, [clusterMembersById, idMap, localFound, setStoredFound])

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSyncDoneRef = useRef(false)
  const legacyMiniCityMigrationRef = useRef<string | null>(null)

  const submitProgress = useCallback(
    async (
      ids: number[],
      timestamps: Record<string, string>,
      immediate = false,
    ) => {
      const localRecord = writeLocalProgress(
        progressScopeSlug,
        {
          foundIds: ids,
          foundTimestamps: timestamps,
        },
        { dirty: Boolean(user) },
      )

      if (!user || !localRecord) {
        return
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return
      }

      const send = async () => {
        try {
          const result = await syncProgressRecords([localRecord])
          if (result.ok) {
            const syncedRecord =
              result.records.find((entry) => entry.citySlug === progressScopeSlug) ??
              result.records[0]
            updateProgressSummary(
              progressScopeSlug,
              syncedRecord?.foundCount ?? ids.length,
            )
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Unable to sync progress', error)
          }
        }
      }

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }

      if (immediate) {
        await send()
        return
      }

      syncTimeoutRef.current = setTimeout(() => {
        void send()
      }, 1200)
    },
    [progressScopeSlug, updateProgressSummary, user],
  )

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const [remoteProgress] = await Promise.all([
          fetchRemoteProgress(progressScopeSlug),
          syncDirtyProgressFromStorage([progressScopeSlug]).catch(() => null),
        ])
        if (cancelled) {
          return
        }
        const localRecord = readLocalProgress(progressScopeSlug)
        const remoteFound = remoteProgress?.foundIds ?? []
        const localFoundIds = localRecord?.foundIds ?? []
        const mergedFound = Array.from(new Set([...localFoundIds, ...remoteFound]))
        const mergedTimestamps = {
          ...(remoteProgress?.foundTimestamps ?? {}),
          ...(localRecord?.foundTimestamps ?? {}),
        }
        if (mergedFound.length > 0) {
          writeLocalProgress(
            progressScopeSlug,
            {
              foundIds: mergedFound,
              foundTimestamps: mergedTimestamps,
            },
            { dirty: Boolean(localRecord?.dirty), lastSyncedAt: localRecord?.lastSyncedAt },
          )
          setStoredFound(mergedFound)
          setFoundTimestamps(() => mergedTimestamps)
          updateProgressSummary(progressScopeSlug, mergedFound.length)
          return
        }
        const fallbackIds = localFoundRef.current ?? []
        if (fallbackIds.length > 0) {
          await submitProgress(
            fallbackIds,
            localTimestampsRef.current ?? {},
            true,
          )
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Unable to load synced progress', error)
        }
      } finally {
        initialSyncDoneRef.current = true
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    progressScopeSlug,
    setFoundTimestamps,
    setStoredFound,
    submitProgress,
    updateProgressSummary,
    user,
  ])

  useEffect(() => {
    if (!user || !initialSyncDoneRef.current) {
      return
    }
    void submitProgress(scopeFound, foundTimestamps)
  }, [foundTimestamps, scopeFound, submitProgress, user])

  useEffect(() => {
    if (progressScopeSlug === CITY_NAME) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    const migrationScopeKey = `${progressScopeSlug}->${CITY_NAME}`
    if (legacyMiniCityMigrationRef.current === migrationScopeKey) {
      return
    }
    legacyMiniCityMigrationRef.current = migrationScopeKey

    try {
      const legacyFoundRaw = window.localStorage.getItem(`${CITY_NAME}-stations`)
      const legacyTimestampsRaw = window.localStorage.getItem(
        `${CITY_NAME}-stations-found-at`,
      )
      const legacyIsNewPlayerRaw = window.localStorage.getItem(
        `${CITY_NAME}-stations-is-new-player`,
      )

      const legacyFound = legacyFoundRaw ? JSON.parse(legacyFoundRaw) : null
      const legacyTimestamps = legacyTimestampsRaw
        ? (JSON.parse(legacyTimestampsRaw) as Record<string, string>)
        : null

      const hasLegacyFound =
        Array.isArray(legacyFound) &&
        legacyFound.some((id) => typeof id === 'number')
      const hasLegacyTimestamps =
        legacyTimestamps && typeof legacyTimestamps === 'object'
      const legacyMarkedAsReturning = legacyIsNewPlayerRaw === 'false'

      if (!hasLegacyFound && !hasLegacyTimestamps && !legacyMarkedAsReturning) {
        return
      }

      if (hasLegacyFound) {
        const merged = mergeScopeFoundIds(
          legacyFound.filter((id): id is number => typeof id === 'number'),
          localFound,
        )
        setStoredFound(merged)
      }

      if (hasLegacyTimestamps) {
        setStoredFoundTimestamps((prev) => ({
          ...(legacyTimestamps as Record<string, string>),
          ...(prev ?? {}),
        }))
      }

      if (legacyMarkedAsReturning) {
        setStoredIsNewPlayer(false)
      }

      window.localStorage.removeItem(`${CITY_NAME}-stations`)
      window.localStorage.removeItem(`${CITY_NAME}-stations-found-at`)
      window.localStorage.removeItem(`${CITY_NAME}-stations-is-new-player`)
    } catch {
      // ignore storage migration errors
    }
  }, [
    CITY_NAME,
    localFound,
    mergeScopeFoundIds,
    progressScopeSlug,
    setStoredFound,
    setStoredFoundTimestamps,
    setStoredIsNewPlayer,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const persistSnapshot = (
      slug: string,
      ids: number[],
      timestamps: Record<string, string>,
    ) => {
      window.localStorage.setItem(`${slug}-stations`, JSON.stringify(ids))
      window.localStorage.setItem(
        `${slug}-stations-found-at`,
        JSON.stringify(timestamps),
      )
      window.localStorage.setItem(
        `${slug}-stations-is-new-player`,
        ids.length > 0 ? 'false' : String(isNewPlayer),
      )
      writeLocalProgress(
        slug,
        {
          foundIds: ids,
          foundTimestamps: timestamps,
        },
        { dirty: Boolean(user) },
      )
      updateProgressSummary(slug, ids.length)
    }

    const buildScopedTimestamps = (ids: number[]) =>
      Object.fromEntries(
        Object.entries(foundTimestamps).filter(([id]) =>
          ids.includes(Number(id)),
        ),
      )

    if (miniCityLinks?.mode === 'parent') {
      miniCityLinks.siblings.forEach((miniCity) => {
        const includeLines = new Set(miniCity.includeLines)
        const scopedIds = scopeFound.filter((id) => {
          const feature = idMap.get(id)
          const line = feature?.properties?.line
          return typeof line === 'string' && includeLines.has(line)
        })
        persistSnapshot(miniCity.slug, scopedIds, buildScopedTimestamps(scopedIds))
      })
      return
    }

    if (miniCityLinks?.mode === 'child') {
      miniCityLinks.siblings.forEach((miniCity) => {
        if (miniCity.slug === CITY_NAME) {
          persistSnapshot(miniCity.slug, found, buildScopedTimestamps(found))
          return
        }

        const stationIds = siblingMiniCityStationIds[miniCity.slug]
        if (!stationIds) {
          return
        }

        const scopedIds = scopeFound.filter((id) => stationIds.has(id))
        persistSnapshot(miniCity.slug, scopedIds, buildScopedTimestamps(scopedIds))
      })
      return
    }

    if (progressScopeSlug !== CITY_NAME) {
      persistSnapshot(CITY_NAME, found, buildScopedTimestamps(found))
    }
  }, [
    CITY_NAME,
    found,
    foundTimestamps,
    idMap,
    isNewPlayer,
    miniCityLinks,
    progressScopeSlug,
    siblingMiniCityStationIds,
    scopeFound,
    updateProgressSummary,
    user,
  ])

  useEffect(() => {
    if (found.length === 0) {
      return
    }

    const now = new Date().toISOString()
    setFoundTimestamps((prev) => {
      const next = { ...prev }
      let changed = false

      for (const id of found) {
        const key = String(id)
        if (!next[key]) {
          next[key] = now
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [found, setFoundTimestamps])

  const clearStoredProgress = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.removeItem(`${progressScopeSlug}-stations`)
      window.localStorage.removeItem(`${progressScopeSlug}-stations-found-at`)
      window.localStorage.removeItem(`${progressScopeSlug}-stations-is-new-player`)
      clearLocalProgressRecord(progressScopeSlug)
      miniCityLinks?.siblings.forEach((miniCity) => {
        window.localStorage.removeItem(`${miniCity.slug}-stations`)
        window.localStorage.removeItem(`${miniCity.slug}-stations-found-at`)
        window.localStorage.removeItem(`${miniCity.slug}-stations-is-new-player`)
        clearLocalProgressRecord(miniCity.slug)
      })
      if (progressScopeSlug !== CITY_NAME) {
        window.localStorage.removeItem(`${CITY_NAME}-stations`)
        window.localStorage.removeItem(`${CITY_NAME}-stations-found-at`)
        window.localStorage.removeItem(`${CITY_NAME}-stations-is-new-player`)
        clearLocalProgressRecord(CITY_NAME)
      }
    } catch {
      // ignore storage errors
    }
  }, [CITY_NAME, miniCityLinks, progressScopeSlug])

  const performReset = useCallback(() => {
    suppressAutoRevealForCity(CITY_NAME)
    if (map && map.getSource('features')) {
      map.removeFeatureState({ source: 'features' })
    }
    setFound([])
    setIsNewPlayer(true)
    setFoundTimestamps(() => ({}))
    setSolutionsUnlocked(false)
    setSolutionsPromptOpen(false)
    setSolutionsPassword('')
    setSolutionsError(false)
    setMobileSidebarOpen(false)
    setHoveredId(null)
    setActiveFoundId(null)
    setMistakes(0)
    perfectStartEligibleRef.current = true
    perfectStartCountRef.current = 0
    neverRepeatRef.current = true
    typoFreeRef.current = true
    comebackArmedRef.current = false
    comebackTriggeredRef.current = false
    clearStoredProgress()
    void submitProgress([], {}, true)
    if (shouldRestoreMainInputFocus(inputRef.current)) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [
    map,
    setFound,
    setIsNewPlayer,
    setFoundTimestamps,
    setSolutionsUnlocked,
    setSolutionsPromptOpen,
    setSolutionsPassword,
    setSolutionsError,
    setMobileSidebarOpen,
    setHoveredId,
    setActiveFoundId,
    clearStoredProgress,
    submitProgress,
    inputRef,
    CITY_NAME,
  ])

  const onReset = useCallback(() => {
    setResetConfirmOpen(true)
  }, [])

  const handleResetCancel = useCallback(() => {
    setResetConfirmOpen(false)
    if (shouldRestoreMainInputFocus(inputRef.current)) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [inputRef])

  const handleResetConfirm = useCallback(() => {
    setResetConfirmOpen(false)
    performReset()
  }, [performReset])

  useEffect(() => {
    if (!resetConfirmOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleResetCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleResetCancel, resetConfirmOpen])

  const foundStationsPerLine = useMemo(() => {
    const lineMap = new Map<string, Set<string>>()
    for (let id of found || []) {
      const feature = idMap.get(id)
      if (!feature) {
        continue
      }
      const line = feature.properties.line
      if (!line) {
        continue
      }
      const key = getStationKey(feature)
      if (!lineMap.has(line)) {
        lineMap.set(line, new Set<string>())
      }
      lineMap.get(line)!.add(key)
    }

    const result: Record<string, number> = {}
    lineMap.forEach((keys, line) => {
      result[line] = keys.size
    })
    return result
  }, [found, idMap])

  const launchCompletionConfetti = useCallback(() => {
    if (
      !settings.confettiEnabled ||
      (settings.stopConfettiAfterCompletion && cityCompletionConfettiSeen)
    ) {
      return
    }
    const lineColors = Object.values(displayLines ?? {})
      .map((line) => line?.color)
      .filter((color): color is string => typeof color === 'string' && color.length > 0)
    const images = buildLineImageConfetti(displayLines ?? {})

    const makeConfetti = async () => {
      const confetti = (await import('tsparticles-confetti')).confetti
      confetti({
        spread: 130,
        ticks: 200,
        particleCount: 220,
        origin: { y: 0.2 },
        decay: 0.88,
        gravity: 1.8,
        startVelocity: 55,
        scalar: 1.4,
        shapes: images ? ['image'] : ['circle', 'square'],
        shapeOptions: images ? { image: images } : undefined,
        colors: images ? undefined : lineColors.length > 0 ? lineColors : undefined,
      })
    }

    void makeConfetti()

    if (!cityCompletionConfettiSeen) {
      markCityCompletionConfettiSeen()
    }
  }, [
    cityCompletionConfettiSeen,
    displayLines,
    markCityCompletionConfettiSeen,
    settings.confettiEnabled,
    settings.stopConfettiAfterCompletion,
  ])

  const revealAllStations = useCallback(() => {
    setFound(allStationIds)
    setIsNewPlayer(false)
    setHideLabels(false)
    setFoundTimestamps((prev) => {
      const next = { ...prev }
      const timestamp = new Date().toISOString()
      for (const id of allStationIds) {
        const key = String(id)
        if (!next[key]) {
          next[key] = timestamp
        }
      }
      return next
    })
    launchCompletionConfetti()
  }, [
    allStationIds,
    setFound,
    setIsNewPlayer,
    setHideLabels,
    setFoundTimestamps,
    launchCompletionConfetti,
  ])

  const handleProtectedAction = useCallback(
    (action: () => void, type: 'solutions' | 'satellite' | 'mapNames') => {
      if (solutionsUnlocked) {
        action()
        return
      }

      pendingActionRef.current = action
      setActionType(type)
      setSolutionsPassword('')
      setSolutionsError(false)
      setSolutionsPromptOpen(true)
    },
    [solutionsUnlocked, setSolutionsPassword, setSolutionsError, setSolutionsPromptOpen],
  )

  const handleRevealSolutions = useCallback(() => {
    handleProtectedAction(() => {
        clearAutoRevealSuppressionForCity(CITY_NAME)
        revealAllStations()
        if (shouldRestoreMainInputFocus(inputRef.current)) {
          setTimeout(() => {
            inputRef.current?.focus()
          }, 0)
        }
    }, 'solutions')
  }, [
    CITY_NAME,
    handleProtectedAction,
    revealAllStations,
    inputRef,
  ])

  const handleToggleSatellite = useCallback(() => {
    handleProtectedAction(() => {
      setShowSatellite((prev) => !prev)
    }, 'satellite')
  }, [handleProtectedAction])

  const handleToggleZen = useCallback(() => {
    setZenMode((prev) => !prev)
  }, [])

  const handleSolutionsClose = useCallback(() => {
    setSolutionsPromptOpen(false)
    setSolutionsPassword('')
    setSolutionsError(false)
    if (shouldRestoreMainInputFocus(inputRef.current)) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [setSolutionsPromptOpen, setSolutionsPassword, setSolutionsError])

  const handleSolutionsPasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSolutionsPassword(event.target.value)
    },
    [setSolutionsPassword],
  )

  const handleSolutionsSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const password = solutionsPassword.trim()
      if (!password) {
        setSolutionsError(true)
        return
      }
      try {
        const response = await fetch('/api/solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const json = await response.json().catch(() => ({}))
        if (!response.ok || !json?.success) {
          setSolutionsError(true)
          return
        }
        clearAutoRevealSuppressionForCity(CITY_NAME)
        writeSolutionsAccess(true)
        setSolutionsUnlocked(true)
        setSolutionsAccessPassword(password)
        if (pendingActionRef.current) {
            pendingActionRef.current()
            pendingActionRef.current = null
        } else {
             // Fallback if no specific action was pending, though technically should allow just unlocking
             // But for now, if they just hit unlock without a pending action (not possible via UI currently), do nothing special
        }
        
        setSolutionsPromptOpen(false)
        setSolutionsPassword('')
        setSolutionsError(false)
        if (shouldRestoreMainInputFocus(inputRef.current)) {
          setTimeout(() => {
            inputRef.current?.focus()
          }, 0)
        }
      } catch (error) {
        setSolutionsError(true)
        if (process.env.NODE_ENV !== 'production') {
          console.error('Unable to validate solutions password', error)
        }
      }
    },
    [
      CITY_NAME,
      solutionsPassword,
      revealAllStations,
      setSolutionsPromptOpen,
      setSolutionsPassword,
      setSolutionsError,
    ],
  )

  const autoRevealRef = useRef(false)

  useEffect(() => {
    if (autoRevealRef.current) {
      return
    }
    if (shouldAutoRevealSolutions(CITY_NAME)) {
      autoRevealRef.current = true
      setSolutionsUnlocked(true)
      revealAllStations()
    }
  }, [CITY_NAME, revealAllStations, setSolutionsUnlocked])

  const fuse = useMemo(
    () =>
      new Fuse(featureCollection.features, {
        includeScore: true,
        includeMatches: true,
        keys: [
          'properties.name',
          'properties.long_name',
          'properties.short_name',
          'properties.alternate_names',
        ],
        minMatchCharLength: 2,
        threshold: settings.stationMatchingMode === 'forgiving' ? 0.22 : 0.15,
        distance: settings.stationMatchingMode === 'forgiving' ? 20 : 10,
        getFn: (obj, path) => {
          const value = Fuse.config.getFn(obj, path)
          if (value === undefined) {
            return ''
          } else if (Array.isArray(value)) {
            return value.map((el) => normalizeString(el))
          } else if (typeof value === 'string') {
            return normalizeString(value)
          } else {
            return normalizeString(String(value ?? ''))
          }
        },
      }),
    [featureCollection.features, normalizeString, settings.stationMatchingMode],
  )

  const uniqueStationsMap = useMemo(() => {
    const map = new Map<string, DataFeature>()
    for (const feature of featureCollection.features) {
      const key = getStationKey(feature)
      if (!map.has(key)) {
        map.set(key, feature)
      }
    }
    return map
  }, [featureCollection.features])

  const totalUniqueStations = uniqueStationsMap.size

  const metadataTitle = useMemo(
    () => extractMetadataTitle(METADATA?.title),
    [METADATA?.title],
  )

  const cityDisplayName = useMemo(
    () => {
      const derived = deriveCityDisplayName(metadataTitle, CITY_NAME)
      const localizedTitle = formatLocalizedChinaUiTitle(
        derived,
        CITY_NAME,
        settings.language,
      )
      return formatLocalizedCityName(
        localizedTitle || derived,
        CITY_NAME,
        settings.language,
      )
    },
    [metadataTitle, CITY_NAME, settings.language],
  )
  const cityDescription = useMemo(() => {
    const description =
      typeof METADATA?.description === 'string' ? METADATA.description : ''
    return formatLocalizedChinaUiDescription(
      description,
      CITY_NAME,
      settings.language,
    )
  }, [CITY_NAME, METADATA?.description, settings.language])
  const normalizeMiniCityLabel = useCallback(
    (value: string) =>
      value
        .replace(
          /\uFF08([^\uFF09]+)\uFF09[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+(?=\))/g,
          '\uFF08$1\uFF09',
        )
        .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000]+(?=\))/g, ''),
    [],
  )
  const getTranslatedMiniCityLabel = useCallback(
    (slug: string, fallback: string) => {
      const keyBySlug: Record<string, string> = {
        gba: 'miniCityParentGba',
        'gba-guangzhou': 'miniCityNameGbaGuangzhou',
        'gba-foshan': 'miniCityNameGbaFoshan',
        'gba-dongguan': 'miniCityNameGbaDongguan',
        'gba-shenzhen': 'miniCityNameGbaShenzhen',
        'gba-hong-kong': 'miniCityNameGbaHongKong',
        'gba-mtr-heavy-rail': 'miniCityNameGbaMtrHeavyRail',
        'gba-mtr-light-rail': 'miniCityNameGbaMtrLightRail',
        'gba-macau': 'miniCityNameGbaMacau',
      }

      const key = keyBySlug[slug]
      if (!key) {
        return normalizeMiniCityLabel(fallback)
      }

      const value = t(key)
      return normalizeMiniCityLabel(
        typeof value === 'string' && value !== key ? value : fallback,
      )
    },
    [normalizeMiniCityLabel, settings.language, t],
  )
  // Custom layouts card, shown in both the desktop sidebar and the mobile drawer.
  const customLayoutsPanel = isCustomWorldMap ? null : (
    <CustomLayoutsPanel
      parentSlug={customLayoutParentSlug}
      currentLayout={currentCustomLayout}
      onCreate={() => {
        // From a smaller version, start from its lines.
        setCustomEditing(
          miniCityLinks?.mode === 'child'
            ? { parentSlug: customLayoutParentSlug, lines: Object.keys(LINES), title: '' }
            : null,
        )
        setCustomModalOpen(true)
      }}
      onEdit={(layout) => {
        setCustomEditing(layout)
        setCustomModalOpen(true)
      }}
    />
  )

  const relatedVersionsPanel = useMemo(() => {
    if (!miniCityLinks) {
      return null
    }

    if (miniCityLinks.mode === 'parent' && miniCityLinks.siblings.length > 0) {
      return {
        title:
          (typeof t('playSmallerVersionsTitle') === 'string' &&
          t('playSmallerVersionsTitle') !== 'playSmallerVersionsTitle'
            ? t('playSmallerVersionsTitle')
            : 'Play smaller versions') as string,
        description: t('playSmallerVersionsDesc', { city: cityDisplayName }) as string,
        items: miniCityLinks.siblings.map((item) => ({
          slug: item.slug,
          name: getTranslatedMiniCityLabel(item.slug, item.name),
          link: item.link,
        })),
        currentSlug: null,
      }
    }

    if (miniCityLinks.mode === 'child') {
      const items = []
      if (miniCityLinks.parent) {
        items.push({
          slug: miniCityLinks.parent.parentSlug,
          name: getTranslatedMiniCityLabel(
            miniCityLinks.parent.parentSlug,
            miniCityLinks.parent.parentName,
          ),
          link: miniCityLinks.parent.parentLink,
        })
      }
      miniCityLinks.siblings.forEach((item) => {
        items.push({
          slug: item.slug,
          name: getTranslatedMiniCityLabel(item.slug, item.name),
          link: item.link,
        })
      })

      const parentDisplayName = getTranslatedMiniCityLabel(
        miniCityLinks.parent?.parentSlug ?? '',
        miniCityLinks.parent?.parentName ?? cityDisplayName,
      )

      return {
        title:
          (typeof t('relatedVersionsTitle') === 'string' &&
          t('relatedVersionsTitle') !== 'relatedVersionsTitle'
            ? t('relatedVersionsTitle')
            : 'Related versions') as string,
        description: t('relatedVersionsDesc', { city: parentDisplayName }) as string,
        items,
        currentSlug: CITY_NAME,
      }
    }

    return null
  }, [CITY_NAME, cityDisplayName, getTranslatedMiniCityLabel, miniCityLinks, settings.language, t])

  const awardAchievement = useCallback(
    (id: string, title: string, description: string) => {
      if (earnedAchievementsRef.current.has(id)) return
      earnedAchievementsRef.current.add(id)
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            'mm-achievements-earned',
            JSON.stringify(Array.from(earnedAchievementsRef.current)),
          )
        } catch {
          // ignore
        }
      }
      if (!settings.achievementToastsEnabled) return

      let hidden = false
      if (typeof window !== 'undefined') {
        try {
          hidden = window.localStorage.getItem(achievementToastStorageKey(id)) === '1'
        } catch {
          hidden = false
        }
      }
      if (hidden) return

      setAchievementToast({
        slug: id,
        cityName: cityDisplayName,
        title,
        description,
      })
    },
    [CITY_NAME, cityDisplayName, settings.achievementToastsEnabled],
  )



  const recordLineMaster = useCallback(
    (key: string) => {
      if (typeof window === 'undefined') return
      if (isMiniCity) return
      try {
        const raw = window.localStorage.getItem('mm-line-master-keys')
        const parsed = raw ? JSON.parse(raw) : []
        const entries = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
        const set = new Set(entries)
        const initialSize = set.size
        set.add(key)
        if (set.size !== initialSize) {
          window.localStorage.setItem('mm-line-master-keys', JSON.stringify(Array.from(set)))
        }
        if (set.size >= 5) {
          awardAchievement('line-finisher', 'Line Finisher', 'Complete 5 different lines.')
        }
        if (set.size >= 25) {
          awardAchievement('line-legend', 'Line Legend', 'Complete 25 different lines.')
        }
      } catch {
        // ignore storage errors
      }
    },
    [awardAchievement, isMiniCity],
  )

  const registerMapNamesToggle = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('mm-map-names-toggles')
      const current = Number(raw)
      const next = Number.isFinite(current) ? current + 1 : 1
      window.localStorage.setItem('mm-map-names-toggles', String(next))
    } catch {
      // ignore
    }
  }, [awardAchievement])

  const handleToggleMapNames = useCallback(() => {
    handleProtectedAction(() => {
      const currentMapView = !isCustomWorldMap && map ? getStoredMapViewFromMap(map) : null
      if (currentMapView) {
        savedMapViewRef.current = currentMapView
      }
      setShowMapNames((prev) => !prev)
      registerMapNamesToggle()
    }, 'mapNames')
  }, [handleProtectedAction, isCustomWorldMap, map, registerMapNamesToggle])

  useEffect(() => {
    if (!achievementsHydratedRef.current || lineMasterSyncRef.current) return
    if (typeof window === 'undefined') return
    lineMasterSyncRef.current = true
    try {
      const raw = window.localStorage.getItem('mm-line-master-keys')
      const parsed = raw ? JSON.parse(raw) : []
      const stored = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
      const earnedLineMasters = Array.from(earnedAchievementsRef.current).filter((slug) =>
        slug.includes('-line-master-'),
      )
      const merged = new Set([...stored, ...earnedLineMasters])
      window.localStorage.setItem('mm-line-master-keys', JSON.stringify(Array.from(merged)))
      if (merged.size >= 5) {
        awardAchievement('line-finisher', 'Line Finisher', 'Complete 5 different lines.')
      }
      if (merged.size >= 25) {
        awardAchievement('line-legend', 'Line Legend', 'Complete 25 different lines.')
      }
    } catch {
      // ignore
    }
  }, [awardAchievement])

  useEffect(() => {
    Object.entries(foundStationsPerLine).forEach(([line, count]) => {
      const total = stationsPerLine[line]
      if (!total || count < total) return
      const key = `${CITY_NAME}-line-master-${line}`
      if (lineMasterEarnedRef.current.has(key)) return
      lineMasterEarnedRef.current.add(key)
      recordLineMaster(key)
    })
  }, [
    CITY_NAME,
    foundStationsPerLine,
    stationsPerLine,
    recordLineMaster,
  ])

  const registerPlayDay = useCallback(() => {
    if (typeof window === 'undefined') return
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    let playDays = new Set<string>()
    try {
      const raw = window.localStorage.getItem('mm-play-days')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          playDays = new Set(parsed.filter((v) => typeof v === 'string'))
        }
      }
    } catch {
      // ignore
    }
    playDays.add(todayStr)
    window.localStorage.setItem('mm-play-days', JSON.stringify(Array.from(playDays)))
    if (playDays.size >= 7) {
      awardAchievement('weekly-rider', 'Week-Long Commute', 'Play on 7 different days.')
    }
    if (playDays.size >= 30) {
      awardAchievement('season-pass', 'Season Pass', 'Play on 30 different days.')
    }

    lastPlayDateRef.current = todayStr
    window.localStorage.setItem('mm-last-play-date', todayStr)

    const monthKey = today.toISOString().slice(0, 7)
    try {
      const rawMonths = window.localStorage.getItem('mm-play-months')
      const parsedMonths = rawMonths ? JSON.parse(rawMonths) : []
      const entries = Array.isArray(parsedMonths)
        ? parsedMonths.filter((value) => typeof value === 'string')
        : []
      const monthSet = new Set(entries)
      monthSet.add(monthKey)
      window.localStorage.setItem('mm-play-months', JSON.stringify(Array.from(monthSet)))
      if (monthSet.size >= 3) {
        awardAchievement('monthly-commuter', 'Monthly Commuter', 'Play in 3 different months.')
      }
    } catch {
      // ignore
    }
  }, [awardAchievement])

  const handleGuessResult = useCallback(
    (result: { type: 'correct' | 'already' | 'wrong'; addedIds?: number[] }) => {
      if (result.type === 'wrong') {
        hotStreakRef.current = 0
        alreadyStreakRef.current = 0
        wrongStreakRef.current += 1
        if (wrongStreakRef.current >= 10) {
          awardAchievement('butterfingers', 'Butterfingers', 'Make 10 wrong guesses in a row.')
        }
        setMistakes((m) => m + 1)
        if (perfectStartEligibleRef.current) {
          perfectStartEligibleRef.current = false
        }
      }
      if (result.type === 'correct') {
        if (settings.zoomToNewStations && result.addedIds && result.addedIds.length > 0) {
          zoomToFeatures(result.addedIds)
        }
        registerPlayDay()
        wrongStreakRef.current = 0
        alreadyStreakRef.current = 0
        hotStreakRef.current += 1
        if (hotStreakRef.current >= 50) {
          awardAchievement('hot-streak', 'Hot Streak', 'Make 50 correct guesses in a row.')
        }
        const now = new Date()
        const hour = now.getHours()
        if (hour < 4) {
          awardAchievement('night-owl', 'Night Owl', 'Find a station between midnight and 4 a.m.')
        } else if (hour >= 5 && hour < 7) {
          awardAchievement('early-bird', 'Early Bird', 'Find a station between 5 and 7 a.m.')
        }
        if (now.getDay() === 5 && now.getDate() === 13) {
          awardAchievement('unlucky-line', 'Unlucky Line', 'Find a station on a Friday the 13th.')
        }
        if (now.getMonth() === 0 && now.getDate() === 1) {
          awardAchievement(
            'first-train-of-the-year',
            'First Train of the Year',
            "Find a station on New Year's Day.",
          )
        }
        if (perfectStartEligibleRef.current) {
          perfectStartCountRef.current += 1
          if (perfectStartCountRef.current >= 25) {
            awardAchievement(
              'perfect-start',
              'Perfect Start',
              'Make 25 correct guesses in a row to start a city.',
            )
            perfectStartEligibleRef.current = false
          }
        }
      }
      if (result.type === 'already') {
        neverRepeatRef.current = false
        hotStreakRef.current = 0
        wrongStreakRef.current = 0
        alreadyStreakRef.current += 1
        if (alreadyStreakRef.current >= 5) {
          awardAchievement('deja-vu', 'Déjà Vu', 'Guess an already-found station 5 times in a row.')
        }
        if (perfectStartEligibleRef.current) {
          perfectStartEligibleRef.current = false
        }
        registerPlayDay()
      }
    },
    [
      awardAchievement,
      registerPlayDay,
      settings.zoomToNewStations,
      zoomToFeatures,
    ],
  )

  const handleInputEdit = useCallback(() => {
    typoFreeRef.current = false
  }, [])

  const foundStationKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const id of found) {
      const feature = idMap.get(id)
      if (!feature) continue
      keys.add(getStationKey(feature))
    }
    return keys
  }, [found, idMap])

  useEffect(() => {
    if (perfectStartInitializedRef.current) return
    if (foundStationKeys.size > 0) {
      perfectStartEligibleRef.current = false
    }
    perfectStartInitializedRef.current = true
  }, [foundStationKeys.size])

  const foundProportion =
    totalUniqueStations === 0
      ? 0
      : foundStationKeys.size / totalUniqueStations

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isMiniCity) return
    const cityKey = `mm-city-unique-stations-${CITY_NAME}`
    const prevRaw = window.localStorage.getItem(cityKey)
    const prev = Number(prevRaw)
    const previousCount = Number.isFinite(prev) && prev >= 0 ? prev : 0
    const currentCount = foundStationKeys.size
    if (currentCount === previousCount) {
      return
    }
    const globalRaw = window.localStorage.getItem('mm-global-unique-stations')
    const globalPrev = Number(globalRaw)
    const globalCount = Number.isFinite(globalPrev) && globalPrev >= 0 ? globalPrev : 0
    const nextGlobal = Math.max(0, globalCount + (currentCount - previousCount))
    try {
      window.localStorage.setItem(cityKey, String(currentCount))
      window.localStorage.setItem('mm-global-unique-stations', String(nextGlobal))
    } catch {
      // ignore
    }
    if (nextGlobal >= 100) {
      awardAchievement('first-hundred', 'First Hundred', 'Find 100 stations across all cities.')
    }
    if (nextGlobal >= 5000) {
      awardAchievement('station-hoarder', 'Station Hoarder', 'Find 5,000 stations across all cities.')
    }
    if (nextGlobal >= 1000) {
      awardAchievement('station-collector', 'Station Collector', 'Find 1,000 stations across all cities.')
    }
    if (nextGlobal >= 10000) {
      awardAchievement('marathoner', 'Marathoner', 'Find 10,000 stations across all cities.')
    }
  }, [CITY_NAME, awardAchievement, foundStationKeys.size, isMiniCity])

  useEffect(() => {
    if (foundProportion < 0.5) {
      comebackArmedRef.current = true
    }
  }, [foundProportion])

  useEffect(() => {
    if (totalUniqueStations === 0) return
    const ratio = foundStationKeys.size / totalUniqueStations
    if (Math.abs(ratio - 0.618) <= 0.003) {
      awardAchievement('golden-ratio', 'Golden Ratio', 'Reach 61.8% completion in any city.')
    }
    if (Math.abs(ratio - 0.314) <= 0.003) {
      awardAchievement('slice-of-pi', 'Slice of Pi', 'Reach 31.4% completion in any city.')
    }
    if (totalUniqueStations >= 2 && foundStationKeys.size * 2 === totalUniqueStations) {
      awardAchievement('halfway-there', 'Halfway There', 'Reach exactly 50% completion in any city.')
    }
  }, [awardAchievement, foundStationKeys.size, totalUniqueStations])

  const completionProgressRef = useRef(foundProportion)

  useEffect(() => {
    const previous = completionProgressRef.current ?? 0
    const reachedCompletion =
      previous < ACHIEVEMENT_COMPLETION_THRESHOLD &&
      foundProportion >= ACHIEVEMENT_COMPLETION_THRESHOLD

    if (reachedCompletion) {
      const isFlawless = mistakes === 0
      const isAlmostFlawless = mistakes <= 2
      if (isFlawless) {
        awardAchievement('flawless', 'Flawless Route', 'Completed a city with zero mistakes.')
      } else if (isAlmostFlawless) {
        awardAchievement('almost-flawless', 'Almost Flawless', 'Completed a city with two or fewer mistakes.')
      }
      if (comebackArmedRef.current && !comebackTriggeredRef.current) {
        awardAchievement('comeback-kid', 'Comeback Kid', 'Came back from under 50% to complete the city.')
        comebackTriggeredRef.current = true
      }
      if (typoFreeRef.current) {
        awardAchievement('typo-free', 'Typo Free', 'Complete a city without using backspace or delete.')
      }
      if (neverRepeatRef.current) {
        awardAchievement('never-repeat', 'Never Repeat', 'Complete a city without guessing an already-found station.')
      }
      if (totalUniqueStations >= 1500) {
        awardAchievement('big-city-tamer', 'Big City Tamer', 'Complete a city with 1,500+ stations.')
      }
      if (totalUniqueStations > 0 && totalUniqueStations < 20) {
        awardAchievement('underdog', 'Underdog', 'Complete a city with fewer than 20 stations.')
      }
      if (totalUniqueStations >= 500) {
        awardAchievement('heavyweight', 'Heavyweight', 'Complete a city with 500+ stations.')
      }
      if (typeof window !== 'undefined') {
        const addToStoredSet = (key: string, value: string) => {
          try {
            const raw = window.localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : []
            const set = new Set(
              Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [],
            )
            set.add(value)
            window.localStorage.setItem(key, JSON.stringify(Array.from(set)))
            return set.size
          } catch {
            return 0
          }
        }
        if (isFlawless && addToStoredSet('mm-flawless-cities', CITY_NAME) >= 5) {
          awardAchievement(
            'spotless-record',
            'Spotless Record',
            'Complete 5 different cities with zero mistakes.',
          )
        }
        if (isMiniCity && addToStoredSet('mm-mini-completions', CITY_NAME) >= 10) {
          awardAchievement('pocket-explorer', 'Pocket Explorer', 'Complete 10 mini cities.')
        }
      }

      // Main-city-only global completion tracking
      if (typeof window !== 'undefined' && !isMiniCity) {
        const today = new Date().toISOString().slice(0, 10)
        const continent = (cityPath?.split('/')?.[0] ?? 'Global')
        const country = cityPath?.split('/')?.[1]
        let completions: { city: string; continent: string; date: string; country?: string }[] = []
        try {
          const raw = window.localStorage.getItem('mm-completions')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              completions = parsed.filter(
                (c) =>
                  c &&
                  typeof c.city === 'string' &&
                  typeof c.continent === 'string' &&
                  typeof c.date === 'string',
              )
            }
          }
        } catch {}
        completions.push({ city: CITY_NAME, continent, date: today, ...(country ? { country } : {}) })
        window.localStorage.setItem('mm-completions', JSON.stringify(completions))

        const uniqueCities = new Set(completions.map((c) => c.city))
        const uniqueContinents = new Set(completions.map((c) => c.continent))
        const completedToday = completions.filter((c) => c.date === today)
        const hasOtherContinent = completedToday.some((c) => c.city !== CITY_NAME && c.continent !== continent)
        if (hasOtherContinent) {
          awardAchievement('twin-city', 'Twin City', 'Completed two cities from different continents on the same day.')
        }
        if (uniqueContinents.size >= 6) {
          awardAchievement('globe-trotter', 'Globe Trotter', 'Complete cities on 6 different continents.')
        }
        if (uniqueContinents.size >= 3) {
          awardAchievement('all-rounder', 'All Rounder', 'Complete cities on 3 different continents.')
        }
        if (uniqueCities.size >= 100) {
          awardAchievement('explorer-100', 'Centurion Explorer', 'Complete 100 different cities.')
        } else if (uniqueCities.size >= 50) {
          awardAchievement('explorer-50', 'Ultimate Explorer', 'Completed 50 different cities.')
        } else if (uniqueCities.size >= 25) {
          awardAchievement('explorer-25', 'Seasoned Explorer', 'Completed 25 different cities.')
        } else if (uniqueCities.size >= 10) {
          awardAchievement('explorer-10', 'Explorer', 'Completed 10 different cities.')
        } else if (uniqueCities.size >= 3) {
          awardAchievement('explorer-3', 'Rookie Explorer', 'Completed 3 different cities.')
        }
        const uniqueCountries = new Set(
          completions.map((c) => c.country).filter((c): c is string => Boolean(c)),
        )
        if (uniqueCountries.size >= 10) {
          awardAchievement('passport-stamps', 'Passport Stamps', 'Complete cities in 10 different countries.')
        }

        const favoritesKey = getFavoritesStorageKey(user?.id)
        try {
          const rawFavorites = window.localStorage.getItem(favoritesKey)
          const parsedFavorites = rawFavorites ? JSON.parse(rawFavorites) : []
          const favorites = Array.isArray(parsedFavorites)
            ? parsedFavorites.filter((slug) => typeof slug === 'string')
            : []
          if (favorites.includes(CITY_NAME)) {
            const rawCompleted = window.localStorage.getItem('mm-favorites-completed')
            const parsedCompleted = rawCompleted ? JSON.parse(rawCompleted) : []
            const completed = Array.isArray(parsedCompleted)
              ? parsedCompleted.filter((slug) => typeof slug === 'string')
              : []
            const completedSet = new Set(completed)
            completedSet.add(CITY_NAME)
            window.localStorage.setItem(
              'mm-favorites-completed',
              JSON.stringify(Array.from(completedSet)),
            )
            if (completedSet.size >= 5) {
              awardAchievement('favorites-first', 'Favorites First', 'Complete 5 favorited cities.')
            }
          }
        } catch {
          // ignore
        }
      }

      const shouldSuppressGlobal = !settings.achievementToastsEnabled
      const shouldSuppressCity =
        typeof window !== 'undefined' &&
        window.localStorage.getItem(achievementToastStorageKey(CITY_NAME)) === '1'
      if (shouldSuppressGlobal || shouldSuppressCity) {
        completionProgressRef.current = foundProportion
        return
      }
      const achievementMeta = getAchievementForCity(CITY_NAME, cityDisplayName)
      setAchievementToast({
        slug: CITY_NAME,
        cityName: cityDisplayName,
        title: achievementMeta.title,
        description: achievementMeta.description,
      })
    }

    completionProgressRef.current = foundProportion
  }, [
    CITY_NAME,
    awardAchievement,
    cityDisplayName,
    cityPath,
    foundProportion,
    isMiniCity,
    mistakes,
    settings.achievementToastsEnabled,
    totalUniqueStations,
    user?.id,
  ])

  useEffect(() => {
    if (!settings.achievementToastsEnabled) {
      setAchievementToast(null)
    }
  }, [settings.achievementToastsEnabled])

  const mapStyle = useMemo(() => {
    if (startedOffline) {
      return buildOfflineMapStyle(resolvedTheme === 'dark')
    }
    if (usingAmapMapStyle) {
      return buildChinaSafeMapStyle(resolvedTheme === 'dark', {
        showLabels: showMapNames,
      })
    }

    const fallbackLightStyle =
      normalizeMapStyleOverride(appConfig.mapbox.styleLight || undefined) ??
      'mapbox://styles/mapbox/light-v11'

    let baseStyle: string | undefined
    if (typeof MAP_CONFIG.style === 'string') {
      const configuredStyle = normalizeMapStyleOverride(MAP_CONFIG.style)
      baseStyle = configuredStyle?.includes('mapbox://styles/benjamintd/')
        ? fallbackLightStyle
        : configuredStyle ?? undefined
    }

    const darkStyle =
      normalizeMapStyleOverride(appConfig.mapbox.styleDark || undefined) ??
      'mapbox://styles/mapbox/dark-v11'

    const satelliteStyle = 'mapbox://styles/mapbox/satellite-streets-v12'
    return showSatellite
      ? satelliteStyle
      : resolvedTheme === 'dark'
        ? darkStyle
        : baseStyle ?? fallbackLightStyle
  }, [MAP_CONFIG.style, resolvedTheme, showMapNames, showSatellite, startedOffline, usingAmapMapStyle])

  const mapOptions = useMemo(() => {
    const { container: _ignored, ...rest } = MAP_CONFIG as typeof MAP_CONFIG & {
      container?: unknown
    }

    return {
      ...rest,
      style: mapStyle,
    }
  }, [MAP_CONFIG, mapStyle])

  useEffect(() => {
    if (!mapStyleModeReady) {
      return
    }

    configureMapboxRuntime(mapboxgl)
    disableMapboxTelemetry()
    if (appConfig.mapbox.token) {
      mapboxgl.accessToken = appConfig.mapbox.token
    }

    if (!usingAmapMapStyle && !startedOffline && !appConfig.mapbox.token) {
      setMapError('Map cannot load because NEXT_PUBLIC_MAPBOX_TOKEN is missing.')
      setShowMapFallbackPreview(true)
      return
    }

    if (!mapContainerRef.current) {
      return
    }

    if (mapUnavailableRef.current) {
      return
    }

    setMapError(null)
    setShowMapFallbackPreview(false)

    const supported =
      typeof mapboxgl.supported === 'function'
        ? mapboxgl.supported({ failIfMajorPerformanceCaveat: false })
        : true

    if (!supported) {
      setMapError(
        'This browser cannot initialize WebGL, so the map cannot be displayed. Please enable hardware acceleration or try a different browser.',
      )
      setShowMapFallbackPreview(true)
      return
    }

    let mapboxMap: mapboxgl.Map | null = null
    let mapFailed = false
    let mapReady = false
    let chinaSafeRetryRequested = false
    let contextLostHandler: (() => void) | null = null
    let fallbackPreviewTimeout: number | null = null
    let chinaSafeRetryTimeout: number | null = null
    let customLoadRecoveryTimeout: number | null = null

    const clearMapFallbackTimeouts = () => {
      if (typeof window === 'undefined') {
        return
      }
      if (fallbackPreviewTimeout !== null) {
        window.clearTimeout(fallbackPreviewTimeout)
        fallbackPreviewTimeout = null
      }
      if (chinaSafeRetryTimeout !== null) {
        window.clearTimeout(chinaSafeRetryTimeout)
        chinaSafeRetryTimeout = null
      }
      if (customLoadRecoveryTimeout !== null) {
        window.clearTimeout(customLoadRecoveryTimeout)
        customLoadRecoveryTimeout = null
      }
    }

    let initialBounds: [number, number, number, number] | undefined
    const restoredMapView = isCustomWorldMap ? null : savedMapViewRef.current
    const initialBoundsSource = MAP_FROM_DATA
      ? renderDisplayRoutes?.features.length
        ? renderDisplayRoutes
        : renderFeatureCollection.features.length
          ? renderFeatureCollection
          : null
      : null

    if (initialBoundsSource) {
      const box = bbox(initialBoundsSource)
      if (
        box.length === 4 &&
        box.every((n) => Number.isFinite(n)) &&
        box[2] > box[0] &&
        box[3] > box[1]
      ) {
        initialBounds = box as [number, number, number, number]
      }
    }

    const requestAmapRetry = (message?: string) => {
      if (
        usingAmapMapStyle ||
        chinaSafeRetryRequested ||
        !requestInMainlandChina
      ) {
        return false
      }

      chinaSafeRetryRequested = true
      mapFailed = true
      clearMapFallbackTimeouts()
      setMap(null)
      setShowMapFallbackPreview(true)
      setMapError(
        message ??
          (prefersChineseCopy
            ? '\u5e95\u56fe\u52a0\u8f7d\u4e0d\u7a33\u5b9a\uff0c\u6b63\u5728\u5207\u6362\u5230 AMap \u6a21\u5f0f\u3002'
            : 'The base map is unavailable, switching to AMap mode.'),
      )

      try {
        mapboxMap?.remove()
      } catch {
        // Nothing else to do if teardown also fails.
      } finally {
        mapboxMap = null
      }

      setMapStyleMode('amap')
      setMapRetryNonce((prev) => prev + 1)
      return true
    }

    try {
      const options = {
        ...mapOptions,
        container: mapContainerRef.current,
      }

      if (restoredMapView) {
        options.center = restoredMapView.center
        options.zoom = restoredMapView.zoom
      } else if (initialBounds) {
        const [minLng, minLat, maxLng, maxLat] = initialBounds
        options.bounds = [
          [minLng, minLat],
          [maxLng, maxLat],
        ]
        options.fitBoundsOptions = { padding: 100 }
      }

      relaxZoomLimitsToFitNetwork(options, initialBounds, mapContainerRef.current)

      mapboxMap = new mapboxgl.Map(options)
    } catch (error) {
      console.error('Failed to initialize map', error)
      if (
        requestAmapRetry(
          prefersChineseCopy
            ? '\u5730\u56fe\u521d\u59cb\u5316\u5931\u8d25\uff0c\u6b63\u5728\u5207\u6362\u5230 AMap \u6a21\u5f0f\u3002'
            : 'Map initialization failed, switching to AMap mode.',
        )
      ) {
        return
      }
      setMapError(
        'Failed to initialize the map in this environment. Please check WebGL support.',
      )
      setShowMapFallbackPreview(true)
      return
    }

    if (!mapboxMap) {
      return
    }

    if (typeof window !== 'undefined') {
      fallbackPreviewTimeout = window.setTimeout(() => {
        if (mapReady || mapFailed) {
          return
        }
        setShowMapFallbackPreview(true)
        setMapError((current) =>
          current ??
          (prefersChineseCopy
            ? '\u5730\u56fe\u52a0\u8f7d\u8f83\u6162\u3002\u4f60\u53ef\u4ee5\u5148\u7ee7\u7eed\u5217\u8868\u6a21\u5f0f\uff0c\u518d\u7a0d\u540e\u91cd\u8bd5\u5730\u56fe\u3002'
            : 'Map is taking longer than expected. You can continue in list mode and retry the map later.'),
        )
      }, 4000)

      if (!usingAmapMapStyle && requestInMainlandChina) {
        chinaSafeRetryTimeout = window.setTimeout(() => {
          if (mapReady || mapFailed) {
            return
          }
          requestAmapRetry(
            prefersChineseCopy
              ? '\u5730\u56fe\u670d\u52a1\u52a0\u8f7d\u5931\u8d25\uff0c\u6b63\u5728\u5207\u6362\u5230 AMap \u6a21\u5f0f\u3002'
              : 'The map service is unavailable, switching to AMap mode.',
          )
        }, 7000)
      }
    }

    const failMapOnce = (message = mapUnavailableMessage) => {
      if (mapFailed) {
        return
      }

      mapFailed = true
      mapUnavailableRef.current = true
      clearMapFallbackTimeouts()
      setShowMapFallbackPreview(true)
      setMapError(message)
      setMap(null)

      try {
        mapboxMap?.remove()
      } catch {
        // The context is already gone; there is nothing useful to clean up here.
      } finally {
        mapboxMap = null
      }
    }

    contextLostHandler = () => {
      failMapOnce()
    }

    mapboxMap.on('webglcontextlost', contextLostHandler)

    const handleMapError = (event: mapboxgl.MapboxEvent & { error?: unknown }) => {
      const message =
        (event?.error as { message?: string })?.message ??
        (event?.error ? String(event.error) : '')
      const normalizedMessage = message.toLowerCase()
      if (
        (normalizedMessage.includes('resource') ||
          normalizedMessage.includes('sprite') ||
          normalizedMessage.includes('glyph') ||
          normalizedMessage.includes('style') ||
          normalizedMessage.includes('tile') ||
          normalizedMessage.includes('network') ||
          normalizedMessage.includes('load')) &&
        requestAmapRetry(
          prefersChineseCopy
            ? '\u5730\u56fe\u8d44\u6e90\u52a0\u8f7d\u5931\u8d25\uff0c\u6b63\u5728\u5207\u6362\u5230 AMap \u6a21\u5f0f\u3002'
            : 'The map resources failed to load, switching to AMap mode.',
        )
      ) {
        return
      }
      if (normalizedMessage.includes('webgl')) {
        failMapOnce(
          'This browser cannot initialize WebGL, so the map cannot be displayed. Please enable hardware acceleration or try a different browser.',
        )
      }
    }

    mapboxMap.on('error', handleMapError)

    let ensureRouteLayers: (() => void) | null = null
    let persistMapView: (() => void) | null = null
    let refreshVisibleMapData: (() => void) | null = null

    const initializeLoadedMap = () => {
      if (!mapboxMap || mapFailed) return
      if (mapReady) return
      mapReady = true
      clearMapFallbackTimeouts()
      setShowMapFallbackPreview(false)
      setMapError(null)
      mapboxMap.doubleClickZoom.disable()
      const isDarkTheme = resolvedTheme === 'dark' || showSatellite
      const foundTextColor = isDarkTheme
        ? 'rgb(255, 255, 255)'
        : 'rgb(29, 40, 53)'
      const foundHaloColor = isDarkTheme
        ? 'rgba(0, 0, 0, 0.85)'
        : 'rgba(255, 255, 255, 0.8)'
      const hoverTextColor = foundTextColor
      const hoverHaloColor = isDarkTheme
        ? 'rgba(0, 0, 0, 0.85)'
        : 'rgb(255, 255, 255)'
      // Near-black lines (e.g. Nanjing's Hexi Tram) vanish on the dark map, so
      // draw them light grey there; every other line keeps its own colour.
      const nearBlackRouteColors = isDarkTheme
        ? Array.from(
            new Set(
              (renderDisplayRoutes?.features ?? [])
                .map((feature: any) => feature?.properties?.color)
                .filter((color: unknown): color is string => typeof color === 'string')
                .filter((color: string) => isColorNearBlack(color)),
            ),
          )
        : []
      const routeColorExpression: any =
        nearBlackRouteColors.length > 0
          ? [
              'case',
              ['in', ['get', 'color'], ['literal', nearBlackRouteColors]],
              NEAR_BLACK_DARK_MODE_COLOR,
              ['get', 'color'],
            ]
          : ['get', 'color']
      const initialRenderedCollections = renderCullingEnabled
        ? getRenderedCollections(getMapBoundsTuple(mapboxMap.getBounds()))
        : {
            features: renderFeatureCollection,
            routes: renderDisplayRoutes ?? EMPTY_ROUTES_FEATURE_COLLECTION,
          }

      mapboxMap.addSource('features', {
        type: 'geojson',
        data: initialRenderedCollections.features,
      })

      mapboxMap.addSource('hovered', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      const ROUTES_SOURCE_ID = 'game-routes'
      const ROUTES_LAYER_ID = 'game-routes-line'
      const ROUTES_LAYER_CASING_ID = 'game-routes-line-casing'
      const FUTURE_ROUTES_LAYER_ID = 'game-routes-line-future'
      const SIR_LOCAL_LAYER_ID = 'sir-local-line'
      const SIR_LOCAL_CASING_LAYER_ID = 'sir-local-line-casing'
      const PASCACK_LAYER_ID = 'pascack-line'
      const PASCACK_CASING_LAYER_ID = 'pascack-line-casing'
      const SIR_LOCAL_FILTER: any = [
        '==',
        ['get', 'line'],
        'NewYorkSubwaySI',
      ]
      const PASCACK_FILTER: any = [
        '==',
        ['get', 'line'],
        'NJTPascackValley',
      ]

      ensureRouteLayers = () => {
        const mbMap = mapboxMap
        if (!mbMap) return

        if (!MAP_FROM_DATA || !renderDisplayRoutes) {
          return
        }

        if (mbMap.getLayer(ROUTES_LAYER_ID)) {
          return
        }

        const lineWidthExpression: any = [
          'interpolate',
          ['linear'],
          ['zoom'],
          9,
          2.5,
          16,
          6,
          22,
          8,
        ]
        const casingLineWidthExpression: any = [
          'interpolate',
          ['linear'],
          ['zoom'],
          9,
          3.2,
          16,
          7,
          22,
          9.5,
        ]
        const lineOffsetExpression: any = ['match', ['get', 'line'], '', 2, 0]
        const lineSortKeyExpression: any = [
          'case',
          ['==', ['get', 'line'], 'NewYorkSubwaySI'],
          1_000,
          ['==', ['get', 'line'], 'NewYorkSubwaySIExpress'],
          999,
          ['==', ['get', 'line'], 'NJTPascackValley'],
          900,
          ['==', ['get', 'line'], 'NJTMeadowlands'],
          899,
          ['-', 100, ['coalesce', ['get', 'order'], 100]],
        ]

        if (!mbMap.getSource(ROUTES_SOURCE_ID)) {
          const routeData = JSON.parse(
            JSON.stringify(initialRenderedCollections.routes),
          )
          mbMap.addSource(ROUTES_SOURCE_ID, {
            type: 'geojson',
            data: routeData,
          })
        }

        try {
          const ensureOverlayPair = (
            lineId: string,
            casingId: string,
            filter: any,
            sortKeyBase: number,
          ) => {
            if (!mbMap.getSource(ROUTES_SOURCE_ID)) return

            if (!mbMap.getLayer(casingId)) {
              mbMap.addLayer({
                id: casingId,
                type: 'line',
                paint: {
                  'line-width': casingLineWidthExpression,
                  'line-color': 'rgba(24,24,27,0.45)',
                  'line-opacity': 0.65,
                  'line-offset': lineOffsetExpression,
                },
                layout: {
                  'line-sort-key': sortKeyBase,
                  'line-cap': 'round',
                  'line-join': 'round',
                },
                filter,
                source: ROUTES_SOURCE_ID,
              })
            }

            if (!mbMap.getLayer(lineId)) {
              mbMap.addLayer({
                id: lineId,
                type: 'line',
                paint: {
                  'line-width': lineWidthExpression,
                  'line-color': routeColorExpression,
                  'line-opacity': 0.95,
                  'line-offset': lineOffsetExpression,
                },
                layout: {
                  'line-sort-key': sortKeyBase + 1,
                  'line-cap': 'round',
                  'line-join': 'round',
                },
                filter,
                source: ROUTES_SOURCE_ID,
              })
            }
          }

          if (!mbMap.getLayer(ROUTES_LAYER_CASING_ID)) {
            mbMap.addLayer({
              id: ROUTES_LAYER_CASING_ID,
              type: 'line',
              paint: {
                'line-width': casingLineWidthExpression,
                'line-color': 'rgba(24,24,27,0.45)',
                'line-opacity': 0.6,
                'line-offset': lineOffsetExpression,
              },
              layout: {
                'line-sort-key': lineSortKeyExpression,
                'line-cap': 'round',
                'line-join': 'round',
              },
              source: ROUTES_SOURCE_ID,
            })
          }

          if (!mbMap.getLayer(ROUTES_LAYER_ID)) {
            mbMap.addLayer({
              id: ROUTES_LAYER_ID,
              type: 'line',
              paint: {
                'line-width': lineWidthExpression,
                'line-color': routeColorExpression,
                'line-opacity': 0.9,
                'line-offset': lineOffsetExpression,
              },
              layout: {
                'line-sort-key': lineSortKeyExpression,
                'line-cap': 'round',
                'line-join': 'round',
              },
              source: ROUTES_SOURCE_ID,
            })
          }

          ensureOverlayPair(
            SIR_LOCAL_LAYER_ID,
            SIR_LOCAL_CASING_LAYER_ID,
            SIR_LOCAL_FILTER,
            10_000,
          )
          ensureOverlayPair(
            PASCACK_LAYER_ID,
            PASCACK_CASING_LAYER_ID,
            PASCACK_FILTER,
            9_100,
          )

          // Planned or under-construction track (route features with
          // "future": true) gets white dashes over its colour.
          if (!mbMap.getLayer(FUTURE_ROUTES_LAYER_ID)) {
            mbMap.addLayer({
              id: FUTURE_ROUTES_LAYER_ID,
              type: 'line',
              filter: ['==', ['get', 'future'], true],
              paint: {
                'line-width': lineWidthExpression,
                'line-color': '#ffffff',
                'line-opacity': 0.85,
                'line-dasharray': [1, 1.2],
              },
              layout: {
                'line-sort-key': 20_000,
                'line-cap': 'butt',
                'line-join': 'round',
              },
              source: ROUTES_SOURCE_ID,
            })
          }
        } catch (error) {
          console.error('Failed to add route layer', error)
        }
      }

      ensureRouteLayers()

      if (renderCullingEnabled) {
        refreshVisibleMapData = () => {
          if (!mapboxMap) {
            return
          }
          refreshRenderedSources(mapboxMap)
        }
        mapboxMap.on('moveend', refreshVisibleMapData)
      }

      if (MAP_FROM_DATA) {
        mapboxMap.addLayer({
          type: 'circle',
          source: 'features',
          id: 'stations',
          paint: {
            // Stay thinner than the 2.5px route lines when zoomed far out:
            // on country-wide networks the stations sit a few pixels apart,
            // and bigger white dots would hide the lines between them.
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3,
              0.5,
              6,
              0.8,
              9,
              1.5,
              16,
              10,
            ],
            'circle-color': '#ffffff',
            'circle-stroke-color': 'rgb(122, 122, 122)',
            'circle-stroke-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              4,
              0.15,
              8,
              0.5,
              22,
              2,
            ],
          },
        })

        const mapBoundsSource = renderDisplayRoutes?.features.length
          ? renderDisplayRoutes
          : renderFeatureCollection.features.length
            ? renderFeatureCollection
            : null

        if (mapBoundsSource) {
          const box = bbox(mapBoundsSource)
          const [minLng, minLat, maxLng, maxLat] = box
          const hasValidBox =
            Number.isFinite(minLng) &&
            Number.isFinite(minLat) &&
            Number.isFinite(maxLng) &&
            Number.isFinite(maxLat) &&
            maxLng > minLng &&
            maxLat > minLat &&
            minLat >= -90 &&
            minLat <= 90 &&
            maxLat >= -90 &&
            maxLat <= 90

          if (hasValidBox) {
            if (!restoredMapView) {
              mapboxMap.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                { padding: 100, duration: 0 },
              )
            }

            mapboxMap.setMaxBounds([
              [minLng - 1, minLat - 1],
              [maxLng + 1, maxLat + 1],
            ])
          }
        }
      }

      if (ensureRouteLayers) {
        mapboxMap.on('styledata', ensureRouteLayers)
      }

      mapboxMap.addLayer({
        id: 'stations-hovered',
        type: 'circle',
        paint: {
          'circle-radius': 16,
          'circle-color': '#fde047',
          'circle-blur-transition': {
            duration: 100,
          },
          'circle-blur': 1,
        },
        source: 'hovered',
        filter: ['==', '$type', 'Point'],
      })

      mapboxMap.addLayer({
        type: 'circle',
        source: 'features',
        id: 'stations-circles',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            // tiny when zoomed far out so dense stations don't hide the lines
            3,
            ['case', ['to-boolean', ['feature-state', 'found']], 1, 0.4],
            6,
            ['case', ['to-boolean', ['feature-state', 'found']], 1.4, 0.6],
            9,
            ['case', ['to-boolean', ['feature-state', 'found']], 2, 1],
            16,
            ['case', ['to-boolean', ['feature-state', 'found']], 6, 4],
          ],
          'circle-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            [
              'match',
              ['get', 'line'],
              ...Object.keys(displayLines).flatMap((line) => [
                [line],
                displayLines[line].color,
              ]),
              'rgba(255, 255, 255, 0.8)',
            ],
            'rgba(255, 255, 255, 0.8)',
          ],
          'circle-stroke-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            [
              'match',
              ['get', 'line'],
              ...Object.keys(displayLines).flatMap((line) => [
                [line],
                displayLines[line].backgroundColor,
              ]),
              'rgba(255, 255, 255, 0.8)',
            ],
            'rgba(120, 120, 120, 0.6)',
          ],
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            ['case', ['to-boolean', ['feature-state', 'found']], 0.4, 0.15],
            9,
            ['case', ['to-boolean', ['feature-state', 'found']], 1, 0.75],
          ],
        },
        layout: {
          'circle-sort-key': ['-', 100, ['get', 'order']],
        },
      })

      mapboxMap.addLayer({
        minzoom: 11,
        layout: {
          'text-field': [
            'to-string',
            ['coalesce', ['get', 'display_name'], ['get', 'name']],
          ],
          'text-font': ['Cabin Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'bottom',
          'text-offset': [0, -0.5],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 12, 22, 14],
        },
        type: 'symbol',
        source: 'features',
        id: 'stations-labels',
        paint: {
          'text-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            foundTextColor,
            'rgba(0, 0, 0, 0)',
          ],
          'text-halo-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            foundHaloColor,
            'rgba(0, 0, 0, 0)',
          ],
          'text-halo-blur': 1,
          'text-halo-width': 1,
        },
      })

      mapboxMap.addLayer({
        id: 'hover-label-point',
        type: 'symbol',
        paint: {
          'text-halo-color': hoverHaloColor,
          'text-halo-width': 2,
          'text-halo-blur': 1,
          'text-color': hoverTextColor,
        },
        layout: {
          'text-field': [
            'to-string',
            ['coalesce', ['get', 'display_name'], ['get', 'name']],
          ],
          'text-font': ['Cabin Bold', 'Arial Unicode MS Regular'],
          'text-anchor': 'bottom',
          'text-offset': [0, -0.6],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 14, 22, 16],
          'symbol-placement': 'point',
        },
        source: 'hovered',
        filter: ['==', '$type', 'Point'],
      })

      mapboxMap.once('data', () => {
        setMap((map) => (map === null ? mapboxMap : map))
      })

      mapboxMap.once('idle', () => {
        const mbMap = mapboxMap
        if (!mbMap) return
        if (!initialMapViewRef.current) {
          const center = mbMap.getCenter()
          initialMapViewRef.current = {
            zoom: mbMap.getZoom(),
            center: [center.lng, center.lat],
          }
        }
        setMap((map) => (map === null ? mbMap : map))
        mbMap.on('mousemove', ['stations-circles'], (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features.find(
              (candidate) => typeof candidate.id === 'number',
            )
            if (feature && typeof feature.id === 'number') {
              setHoveredId(feature.id as number)
              return
            }
          }

          setHoveredId(null)
        })

        mbMap.on('mouseleave', ['stations-circles'], () => {
          setHoveredId(null)
        })
      })

      persistMapView = () => {
        if (!mapboxMap) return
        const center = mapboxMap.getCenter()
        const zoom = mapboxMap.getZoom()
        const view = { zoom, center: [center.lng, center.lat] as [number, number] }
        if (!isStoredMapView(view)) return
        if (!isCustomWorldMap) {
          savedMapViewRef.current = view
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(mapViewStorageKey, JSON.stringify(view))
          }
        }
        if (isCustomWorldMap) return
        const now = Date.now()
        if (now - lastPersistTsRef.current > 1000) {
          lastPersistTsRef.current = now
          updateUiPreferences({ mapViewByCity: { [CITY_NAME]: view } })
        } else {
          if (mapPersistTimeoutRef.current) {
            window.clearTimeout(mapPersistTimeoutRef.current)
          }
          mapPersistTimeoutRef.current = window.setTimeout(() => {
            updateUiPreferences({ mapViewByCity: { [CITY_NAME]: view } })
            lastPersistTsRef.current = Date.now()
            mapPersistTimeoutRef.current = null
          }, 1000)
        }
      }

      mapboxMap.on('moveend', persistMapView)
      mapboxMap.on('zoomend', persistMapView)
    }

    mapboxMap.on('load', initializeLoadedMap)
    if (mapboxMap.loaded()) {
      initializeLoadedMap()
    } else if (isCustomWorldMap && typeof window !== 'undefined') {
      customLoadRecoveryTimeout = window.setTimeout(() => {
        if (mapboxMap?.loaded()) {
          initializeLoadedMap()
        }
      }, 500)
    }

    return () => {
      clearMapFallbackTimeouts()
      if (!mapboxMap) {
        return
      }
      const currentMapView = isCustomWorldMap ? null : getStoredMapViewFromMap(mapboxMap)
      if (currentMapView) {
        savedMapViewRef.current = currentMapView
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            mapViewStorageKey,
            JSON.stringify(currentMapView),
          )
        }
      }
      if (ensureRouteLayers) {
        mapboxMap.off('styledata', ensureRouteLayers)
      }
      if (refreshVisibleMapData) {
        mapboxMap.off('moveend', refreshVisibleMapData)
      }
      if (contextLostHandler) {
        mapboxMap.off('webglcontextlost', contextLostHandler)
      }
      mapboxMap.off('load', initializeLoadedMap)
      mapboxMap.off('error', handleMapError)
      if (persistMapView) {
        mapboxMap.off('moveend', persistMapView)
        mapboxMap.off('zoomend', persistMapView)
      }
      if (mapPersistTimeoutRef.current) {
        window.clearTimeout(mapPersistTimeoutRef.current)
        mapPersistTimeoutRef.current = null
      }
      mapboxMap.remove()
      setMap(null)
    }
  }, [setMap, displayLines, mapOptions, MAP_FROM_DATA, renderDisplayRoutes, renderFeatureCollection, renderCullingEnabled, getRenderedCollections, refreshRenderedSources, resolvedTheme, CITY_NAME, updateUiPreferences, usingAmapMapStyle, prefersChineseCopy, mapRetryNonce, mapStyleModeReady, mapViewStorageKey, isCustomWorldMap, startedOffline])

  useEffect(() => {
    if (!map) {
      setMapBearing(0)
      return
    }

    const syncBearing = () => {
      const bearing = map.getBearing()
      setMapBearing((current) =>
        Math.abs(current - bearing) < 0.1 ? current : bearing,
      )
    }

    syncBearing()
    map.on('rotate', syncBearing)
    map.on('pitch', syncBearing)

    return () => {
      map.off('rotate', syncBearing)
      map.off('pitch', syncBearing)
    }
  }, [map])

  useEffect(() => {
    if (!map) return

    const applyVisibility = () => {
      let style: ReturnType<mapboxgl.Map['getStyle']>
      try {
        style = map.getStyle()
      } catch {
        return
      }
      if (!style?.layers) return

      for (const layer of style.layers) {
        if (layer.type === 'symbol') {
          if (
            layer.source === 'features' ||
            layer.source === 'hovered' ||
            layer.source === 'game-routes' ||
            layer.id === 'stations-labels' ||
            layer.id === 'hover-label-point'
          ) {
            continue
          }
          const targetVisibility = showMapNames ? 'visible' : 'none'
          safeSetMapLayoutProperty(map, layer.id, 'visibility', targetVisibility)
        }
      }
    }

    applyVisibility()
    map.on('styledata', applyVisibility)

    return () => {
      map.off('styledata', applyVisibility)
    }
  }, [map, showMapNames])

  useEffect(() => {
    if (!map) return

    const handleMapContextMenu = (event: mapboxgl.MapMouseEvent) => {
      if (!canCopyMapCoords) {
        setMapCoordsMenu(null)
        return
      }

      event.preventDefault()
      event.originalEvent.preventDefault()
      setMapCoordsMenu({
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY,
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
      })
    }

    map.on('contextmenu', handleMapContextMenu)
    return () => {
      map.off('contextmenu', handleMapContextMenu)
    }
  }, [canCopyMapCoords, map])

  useEffect(() => {

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const activeTag = document.activeElement?.tagName.toLowerCase()
      const isInputActive = activeTag === 'input' || activeTag === 'textarea'
      
      const combo = getKeystrokeFromEvent(event)
      if (!combo) return

      // Allow Escape to clear from input even if active
      if (isInputActive && combo !== 'Escape') {
        return
      }

      // Check for matching action
      const actionEntry = Object.entries(settings.keybindings).find(
        ([_, boundKey]) => boundKey === combo
      )

      if (actionEntry) {
        const action = actionEntry[0] as KeybindingAction
        
        if (action === 'FOCUS_INPUT') {
            event.preventDefault()
            if (shouldRestoreMainInputFocus(inputRef.current)) {
                inputRef.current?.focus()
            }
        } else if (action === 'CLEAR_INPUT') {
            event.preventDefault()
            if (activeFoundId) {
                setActiveFoundId(null)
            } else if (sidebarOpen) {
                setSidebarOpen(false)
            } else {
                inputRef.current?.blur()
            }
        } else if (action === 'TOGGLE_ZEN_MODE') {
            event.preventDefault()
            setZenMode(prev => !prev)
        } else if (action === 'TOGGLE_SIDEBAR') {
            event.preventDefault()
            setSidebarOpen(prev => !prev)
        } else if (action === 'TOGGLE_SOLUTIONS') {
            event.preventDefault()
            handleRevealSolutions()
        } else if (action === 'TOGGLE_LABELS') {
            event.preventDefault()
            setHideLabels(prev => !prev)
        } else if (action === 'TOGGLE_MAP_NAMES') {
            event.preventDefault()
            handleToggleMapNames()
        } else if (action === 'TOGGLE_SATELLITE') {
            event.preventDefault()
            handleToggleSatellite()
        } else if (action === 'OPEN_CITY_STATS') {
            event.preventDefault()
            setCityStatsOpen(true)
        } else if (action === 'OPEN_ACHIEVEMENTS') {
            event.preventDefault()
            router.push('/?tab=achievements')
        } else if (action === 'OPEN_ACCOUNT') {
            event.preventDefault()
            openAccountModal()
        } else if (action === 'OPEN_SETTINGS') {
            event.preventDefault()
            openSettingsModal()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    settings.keybindings,
    activeFoundId,
    sidebarOpen,
    handleRevealSolutions,
    handleToggleMapNames,
    handleToggleSatellite,
    openAccountModal,
    openSettingsModal,
    router,
    setHideLabels,
    setCityStatsOpen,
  ])


  useEffect(() => {
    if (!map || !(map as any).style) {
      return
    }

    const hoveredSource = map.getSource('hovered') as
      | mapboxgl.GeoJSONSource
      | undefined

    if (!hoveredSource) {
      return
    }

    const isFoundHover =
      hoveredId !== null && found.includes(hoveredId) && idMap.has(hoveredId)

    hoveredSource.setData({
      type: 'FeatureCollection',
      features: isFoundHover ? [idMap.get(hoveredId)!] : [],
    })
  }, [map, hoveredId, idMap, found])

  useEffect(() => {
    if (!map || !(map as any).style || !found) return

    reapplyFoundFeatureState(map)
  }, [found, map, reapplyFoundFeatureState])

  // Double-clicking a route highlights that line on the map itself: the
  // other lines fade back and the picked one gets a contrasting halo, so it
  // stands out in light mode too (where the sidebar's yellow ring is faint).
  const routeOpacityBackupRef = useRef<Record<string, any>>({})
  useEffect(() => {
    if (!map) return

    const HALO_ID = 'game-routes-highlight-halo'
    const LINE_ID = 'game-routes-highlight-line'
    const DIMMABLE_LAYERS = [
      'game-routes-line-casing',
      'game-routes-line',
      'sir-local-line-casing',
      'sir-local-line',
      'pascack-line-casing',
      'pascack-line',
      'game-routes-line-future',
    ]
    const backups = routeOpacityBackupRef.current

    const restore = () => {
      try {
        if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID)
        if (map.getLayer(HALO_ID)) map.removeLayer(HALO_ID)
        for (const layerId of DIMMABLE_LAYERS) {
          if (!(layerId in backups)) continue
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'line-opacity', backups[layerId])
          }
          delete backups[layerId]
        }
      } catch {
        // style may be mid-reload; nothing to restore then
      }
    }

    if (!highlightedLineId) {
      restore()
      return
    }

    const isDarkTheme = resolvedTheme === 'dark'
    const apply = () => {
      try {
        if (!map.getSource('game-routes') || !map.getLayer('game-routes-line')) return
        const isPicked: any = ['==', ['get', 'line'], highlightedLineId]

        for (const layerId of DIMMABLE_LAYERS) {
          if (!map.getLayer(layerId)) continue
          if (!(layerId in backups)) {
            backups[layerId] = map.getPaintProperty(layerId, 'line-opacity') ?? 1
          }
          const base = typeof backups[layerId] === 'number' ? backups[layerId] : 0.9
          map.setPaintProperty(layerId, 'line-opacity', [
            'case',
            isPicked,
            base,
            Math.min(base, 0.18),
          ])
        }

        const beforeId = map.getLayer('stations') ? 'stations' : undefined
        const widthScale = (scale: number): any => [
          'interpolate',
          ['linear'],
          ['zoom'],
          9,
          2.5 * scale,
          16,
          6 * scale,
          22,
          8 * scale,
        ]

        if (!map.getLayer(HALO_ID)) {
          map.addLayer(
            {
              id: HALO_ID,
              type: 'line',
              source: 'game-routes',
              filter: isPicked,
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-width': widthScale(2.6),
                'line-color': isDarkTheme ? '#ffffff' : '#18181b',
                'line-opacity': isDarkTheme ? 0.9 : 0.85,
                'line-blur': 0.5,
              },
            },
            beforeId,
          )
        } else {
          map.setFilter(HALO_ID, isPicked)
          map.setPaintProperty(HALO_ID, 'line-color', isDarkTheme ? '#ffffff' : '#18181b')
        }

        if (!map.getLayer(LINE_ID)) {
          map.addLayer(
            {
              id: LINE_ID,
              type: 'line',
              source: 'game-routes',
              filter: isPicked,
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-width': widthScale(1.6),
                'line-color': map.getPaintProperty('game-routes-line', 'line-color') as any,
                'line-opacity': 1,
              },
            },
            beforeId,
          )
        } else {
          map.setFilter(LINE_ID, isPicked)
        }
      } catch (error) {
        console.error('Failed to highlight line', error)
      }
    }

    apply()
    map.on('styledata', apply)
    return () => {
      map.off('styledata', apply)
    }
  }, [map, highlightedLineId, resolvedTheme])

  useEffect(() => {
    if (!map || !highlightedLineId) return
    // a single click anywhere else dismisses the highlight early
    const clear = (event: mapboxgl.MapMouseEvent) => {
      const hits = map.getLayer('game-routes-line')
        ? map.queryRenderedFeatures(event.point, { layers: ['game-routes-line'] })
        : []
      if (hits.some((f) => f.properties?.line === highlightedLineId)) return
      setHighlightedLineId(null)
    }
    map.on('click', clear)
    return () => {
      map.off('click', clear)
    }
  }, [map, highlightedLineId])

  useEffect(() => {
    if (!map) {
      return
    }

    const handleDoubleClick = (event: mapboxgl.MapLayerMouseEvent) => {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault()
      }

      const feature = event.features?.find(
        (candidate) => typeof candidate.id === 'number',
      )

      if (!feature || typeof feature.id !== 'number') {
        return
      }

      const featureId = feature.id as number

      if (!found.includes(featureId)) {
        return
      }

      setSidebarOpen(true)

      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileSidebarOpen(true)
      }

      setActiveFoundId(featureId)
      setHoveredId(featureId)
    }

    map.on('dblclick', 'stations-circles', handleDoubleClick)
    
    const handleLineDoubleClick = (event: mapboxgl.MapLayerMouseEvent) => {
        if (typeof event.preventDefault === 'function') {
            event.preventDefault()
        }
        
        const feature = event.features?.[0]
        if (!feature) return

        const lineId = feature.properties?.line
        if (typeof lineId === 'string' && lineId) {
            setHighlightedLineId(lineId)
            setSidebarOpen(true)
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setMobileSidebarOpen(true)
            }
        }
    }

    if (!disableRouteLineHighlightInteraction) {
      map.on('dblclick', 'game-routes-line', handleLineDoubleClick)
    }

    return () => {
      map.off('dblclick', 'stations-circles', handleDoubleClick)
      if (!disableRouteLineHighlightInteraction) {
        map.off('dblclick', 'game-routes-line', handleLineDoubleClick)
      }
    }
  }, [
    map,
    found,
    setSidebarOpen,
    setMobileSidebarOpen,
    setActiveFoundId,
    setHoveredId,
    disableRouteLineHighlightInteraction,
  ])

  const zoomToFeature = useCallback(
    (id: number) => {
      if (!map) return

      const feature = renderIdMap.get(id)
      if (!feature) return

      if (feature.geometry.type === 'Point') {
        map.flyTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: 14,
        })
      } else {
        const bounds = new mapboxgl.LngLatBounds()
        coordEach(feature, (coord) => {
          bounds.extend(coord as [number, number])
        })
        map.fitBounds(bounds, { padding: 100 })
      }
    },
    [map, renderIdMap],
  )

  useEffect(() => {
    if (!map) {
      return
    }

    map.resize()

    if (typeof window !== 'undefined') {
      const raf = window.requestAnimationFrame(() => {
        map.resize()
      })

      return () => {
        window.cancelAnimationFrame(raf)
      }
    }
  }, [map, sidebarOpen, zenMode])

  useEffect(() => {
    if (activeFoundId !== null && !found.includes(activeFoundId)) {
      setActiveFoundId(null)
    }
  }, [activeFoundId, found])

  const sidebarStyle = useMemo<CSSProperties | undefined>(() => {
    if (sidebarOpen) {
      return undefined
    }
    return { width: 0, flexBasis: 0 }
  }, [sidebarOpen])

  const showChinaMapStyleTestButton =
    isChinaCity && (requestInMainlandChina || debugMapProviderEnabled)
  const chinaMapStyleTestButtonLabel = usingAmapMapStyle
    ? prefersChineseCopy
      ? '\u5207\u56de Mapbox \u5730\u56fe'
      : 'Use Mapbox map'
    : prefersChineseCopy
      ? '\u4f7f\u7528 AMap \u5730\u56fe'
      : 'Use AMap map'

  const handleOfflineDownload = useCallback(async () => {
    if (offlineDownloadStatus === 'downloading') {
      return
    }
    setOfflineDownloadStatus('downloading')
    setOfflineDownloadError(null)
    try {
      await downloadCityForOffline(progressScopeSlug, {
        pagePath: window.location.pathname + window.location.search,
      })
      setOfflineDownloadStatus('downloaded')
    } catch (error) {
      setOfflineDownloadStatus('error')
      setOfflineDownloadError(error instanceof Error ? error.message : null)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Unable to download city for offline use', error)
      }
    }
  }, [offlineDownloadStatus, progressScopeSlug])

  useEffect(() => {
    const sync = () =>
      setOfflineDownloadStatus((current) =>
        current === 'downloading'
          ? current
          : isCityDownloaded(progressScopeSlug)
            ? 'downloaded'
            : current === 'error'
              ? current
              : 'idle',
      )
    sync()
    window.addEventListener('metro-offline-cities-change', sync)
    return () => window.removeEventListener('metro-offline-cities-change', sync)
  }, [progressScopeSlug])

  return (
    <div className="relative flex h-screen flex-row items-start justify-start bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <ZenModeToast zenMode={zenMode} toggleKey={settings.keybindings.TOGGLE_ZEN_MODE} />
      {mapCoordsToast ? (
        <div className="pointer-events-none fixed bottom-32 left-1/2 z-[110] -translate-x-1/2">
          <div className="rounded-full bg-sky-600/95 px-6 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur dark:bg-sky-400/95 dark:text-zinc-950">
            {mapCoordsToast}
          </div>
        </div>
      ) : null}
      {mapCoordsMenu ? (
        <>
          <div
            className="pointer-events-none fixed z-[119] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-500 bg-sky-500/20 shadow-[0_0_0_4px_rgba(14,165,233,0.16)] dark:border-sky-300 dark:bg-sky-300/20 dark:shadow-[0_0_0_4px_rgba(125,211,252,0.18)]"
            style={{
              left: mapCoordsMenu.x,
              top: mapCoordsMenu.y,
            }}
          />
          <div
            className="fixed z-[120]"
            style={{
              left: mapCoordsMenu.x + 10,
              top: mapCoordsMenu.y + 10,
            }}
          >
            <div
              className="min-w-[140px] rounded-lg border border-zinc-200 bg-white/95 p-1.5 shadow-xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => void copyMapCoords()}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium text-zinc-900 transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <span>Copy coords</span>
                <span className="ml-3 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {mapCoordsMenu.lat.toFixed(4)}, {mapCoordsMenu.lng.toFixed(4)}
                </span>
              </button>
            </div>
          </div>
        </>
      ) : null}
      <div className="relative flex-1 min-w-0 h-full">
        <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
        {highlightedLineId && LINES[highlightedLineId] ? (
          <div
            key={highlightedLineId}
            role="status"
            className="pointer-events-none absolute bottom-10 left-1/2 z-30 flex max-w-[calc(100%-7rem)] -translate-x-1/2 items-center gap-2.5 rounded-full bg-zinc-900/90 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-white shadow-xl ring-2 ring-white/80 backdrop-blur dark:bg-white/95 dark:text-zinc-900 dark:ring-zinc-900/60"
          >
            <LineBadge
              lineId={highlightedLineId}
              line={LINES[highlightedLineId]}
              iconBasePath={cityPath}
              defaultFit="cover"
            />
            <span className="truncate">
              {formatLocalizedLineName(LINES[highlightedLineId].name, settings.language) ||
                LINES[highlightedLineId].name}
            </span>
            {typeof stationsPerLine[highlightedLineId] === 'number' ? (
              <span className="shrink-0 font-normal opacity-75">
                {foundStationsPerLine[highlightedLineId] ?? 0}/{stationsPerLine[highlightedLineId]}
              </span>
            ) : null}
          </div>
        ) : null}
        {!zenMode && map ? (
          <div className="pointer-events-auto absolute bottom-10 left-3 z-30 flex flex-col overflow-hidden rounded-[1.5rem] bg-white/90 text-zinc-700 shadow-lg ring-1 ring-white/60 backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-100 dark:ring-black/50">
            <button
              type="button"
              onClick={() =>
                map.easeTo({
                  bearing: 0,
                  pitch: 0,
                  duration: 700,
                  essential: true,
                })
              }
              className="flex h-10 w-10 items-center justify-center border-b border-zinc-200/80 bg-transparent text-zinc-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700/80 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
              aria-label="Reset orientation"
              title="Reset orientation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  opacity="0.55"
                />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.7" />
                <g
                  style={{
                    transform: `rotate(${-mapBearing}deg)`,
                    transformOrigin: '12px 12px',
                  }}
                >
                  <polygon points="12,3.5 15.6,12 12,10.5 8.4,12" fill="#ef4444" />
                  <polygon
                    points="12,20.5 15.6,12 12,13.5 8.4,12"
                    fill="currentColor"
                    opacity="0.75"
                  />
                </g>
                <circle
                  cx="12"
                  cy="3.8"
                  r="2.3"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="0.7"
                />
                <text
                  x="12"
                  y="3.9"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="3.1"
                  fontWeight="800"
                  fill="#ffffff"
                  fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
                >
                  N
                </text>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                const view = initialMapViewRef.current
                if (!map || !view) {
                  return
                }
                map.flyTo({
                  center: view.center,
                  zoom: view.zoom,
                  speed: 1.2,
                  essential: true,
                })
              }}
              className="flex h-10 w-10 items-center justify-center border-b border-zinc-200/80 bg-transparent text-zinc-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700/80 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6a6 6 0 0 1-6 6c-2.97 0-5.43-2.16-5.91-5H4.07c.5 3.95 3.86 7 7.93 7 4.42 0 8-3.58 8-8s-3.58-8-8-8z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => map.zoomIn()}
              className="flex h-10 w-10 items-center justify-center border-b border-zinc-200/80 bg-transparent text-lg font-semibold text-zinc-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700/80 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => map.zoomOut()}
              className="flex h-10 w-10 items-center justify-center border-b border-zinc-200/80 bg-transparent text-lg font-semibold text-zinc-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-zinc-700/80 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => void handleOfflineDownload()}
              disabled={offlineDownloadStatus === 'downloading'}
              className="flex h-10 w-10 items-center justify-center bg-transparent text-zinc-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] disabled:cursor-wait disabled:opacity-60 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
              aria-label="Download city for offline use"
              title={
                offlineDownloadStatus === 'downloaded'
                  ? 'Downloaded for offline use. Click to update'
                  : offlineDownloadStatus === 'downloading'
                    ? 'Downloading for offline use…'
                    : offlineDownloadStatus === 'error'
                      ? `Download failed${offlineDownloadError ? `: ${offlineDownloadError}` : ''}. Try again`
                      : 'Download city for offline use'
              }
            >
              {offlineDownloadStatus === 'downloading' ? (
                <MdDownloading className="h-5 w-5 animate-pulse" aria-hidden="true" />
              ) : offlineDownloadStatus === 'downloaded' ? (
                <MdDownloadDone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : offlineDownloadStatus === 'error' ? (
                <MdErrorOutline className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              ) : (
                <MdDownload className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        ) : null}
        {!zenMode && (
          <div className="pointer-events-none absolute inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] px-3 transition-all lg:top-6 lg:px-6">
            <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-2 lg:gap-3">
              <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-white/95 p-3 shadow-md backdrop-blur-sm dark:bg-zinc-900/95 dark:text-zinc-100 dark:shadow-black/40 lg:hidden">
                <FoundSummary
                  foundProportion={foundProportion}
                  foundStationsPerLine={foundStationsPerLine}
                  stationsPerLine={stationsPerLine}
                  cityCompletionConfettiSeen={cityCompletionConfettiSeen}
                  onCityCompletionConfettiSeen={markCityCompletionConfettiSeen}
                  minimizable
                  defaultMinimized
                  highlightedLineId={highlightedLineId}
                  iconBasePath={cityPath}
                  onReset={found.length > 0 ? onReset : undefined}
                />
              </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-zinc-700 shadow-lg transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 lg:hidden shrink-0"
                aria-label={`${mobileSidebarOpen ? 'Hide sidebar' : 'Show sidebar'} (${foundStationKeys.size} found)`}
              >
                <span className="flex flex-col items-start leading-none">
                  <span className="text-sm font-bold">{foundStationKeys.size}</span>
                </span>
                <span className="text-sm font-semibold">
                  {mobileSidebarOpen ? (
                    <MdClose className="h-6 w-6" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M0 0h24v24H0V0z" fill="none"/>
                      <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  )}
                </span>
              </button>
              {!mobileSidebarOpen && (
                <Input
                  fuse={fuse}
                  found={found}
                  setFound={setFound}
                  setFoundTimestamps={setFoundTimestamps}
                  setIsNewPlayer={setIsNewPlayer}
                  inputRef={inputRef}
                  map={map}
                  idMap={idMap}
                  clusterGroups={clusterGroups}
                  autoFocus={false}
                  disabled={solutionsPromptOpen || resetConfirmOpen}
                  onGuessResult={handleGuessResult}
                  onInputEdit={handleInputEdit}
                  autoSubmitOnMatch={settings.autoSubmitOnMatch}
                  strictMatching={settings.stationMatchingMode === 'strict'}
                  forgivingMatching={settings.stationMatchingMode === 'forgiving'}
                />
              )}
              {showChinaMapStyleTestButton && (
                <button
                  type="button"
                  onClick={() =>
                    handleRetryMap(
                      usingAmapMapStyle ? 'current' : 'amap',
                      { persistPreference: true },
                    )
                  }
                  className={
                    usingAmapMapStyle
                      ? 'group inline-flex h-12 min-w-[3rem] items-center justify-center overflow-hidden rounded-full bg-sky-600 px-3 text-white shadow-lg transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:bg-sky-500 dark:text-zinc-950 dark:hover:bg-sky-400'
                      : 'group inline-flex h-12 min-w-[3rem] items-center justify-center overflow-hidden rounded-full bg-white px-3 text-zinc-700 shadow-lg transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
                  }
                  aria-label={chinaMapStyleTestButtonLabel}
                  title={chinaMapStyleTestButtonLabel}
                >
                  {usingAmapMapStyle ? (
                    <MdMap className="h-5 w-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <MdLayers className="h-5 w-5 shrink-0" aria-hidden="true" />
                  )}
                  <ControlHoverLabel>{chinaMapStyleTestButtonLabel}</ControlHoverLabel>
                  <span className="sr-only">{chinaMapStyleTestButtonLabel}</span>
                </button>
              )}
              <div className="hidden items-center gap-2 lg:flex">
                {found.length > 0 && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="group inline-flex h-12 min-w-[3rem] items-center justify-center overflow-hidden rounded-full bg-red-50 px-3 text-red-600 shadow-lg ring-1 ring-red-200/80 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30 dark:hover:bg-red-500/25"
                    aria-label={t('resetAllProgressLabel')}
                    title={t('resetAllProgressLabel')}
                  >
                    <MdRestartAlt className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <ControlHoverLabel>{t('resetAllProgressLabel')}</ControlHoverLabel>
                    <span className="sr-only">{t('resetAllProgressLabel')}</span>
                  </button>
                )}
                {relatedVersionsPanel ? (
                  <ToolbarPopoverButton icon={MdGridView} label={relatedVersionsPanel.title}>
                    <MiniCityLinksPanel
                      title={relatedVersionsPanel.title}
                      description={relatedVersionsPanel.description}
                      items={relatedVersionsPanel.items}
                      currentSlug={relatedVersionsPanel.currentSlug}
                      collapsible={false}
                    />
                  </ToolbarPopoverButton>
                ) : null}
                {customLayoutsPanel ? (
                  <ToolbarPopoverButton icon={MdDashboardCustomize} label={formatLocalizedChinaUiTitle('Custom layouts', customLayoutParentSlug, settings.language)}>
                    {customLayoutsPanel}
                  </ToolbarPopoverButton>
                ) : null}
                <ThemeToggleButton
                  className="h-12 min-w-[3rem]"
                  hoverLabel={t('changeThemeLabel')}
                />
              </div>
              <MenuComponent
                hideLabels={hideLabels}
                setHideLabels={setHideLabels}
                onRevealSolutions={handleRevealSolutions}
                foundProportion={foundProportion}
                onOpenSettings={openSettingsModal}
                onOpenCityStats={() => setCityStatsOpen(true)}
                onOpenAccount={openAccountModal}
                onOpenPrivacy={openPrivacyModal}
                onOpenMissedGuessInputs={() => setMissedGuessInputsOpen(true)}
                showMissedGuessInputs={solutionsUnlocked}
                zenMode={zenMode}
                onToggleZen={handleToggleZen}
                showSatellite={showSatellite}
                onToggleSatellite={handleToggleSatellite}
                showMapNames={showMapNames}
                onToggleMapNames={handleToggleMapNames}
              />
              {customSharePath ? (
                <button
                  type="button"
                  onClick={() => void shareCustomMap()}
                  className="group inline-flex h-12 min-w-[3rem] items-center justify-center overflow-hidden rounded-full bg-white px-3 text-zinc-700 shadow-lg transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                  aria-label="Share custom map"
                  title="Share custom map"
                >
                  <MdShare className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <ControlHoverLabel>Share custom map</ControlHoverLabel>
                  <span className="sr-only">Share custom map</span>
                </button>
              ) : null}

            </div>
            {showAds && INLINE_AD_SLOT ? (
              <div className="pointer-events-auto">
                <AdSlot
                  slot={INLINE_AD_SLOT}
                  format="horizontal"
                  style={{ height: 100 }}
                  className="w-full"
                  layoutKey={`inline-${CITY_NAME}`}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
      </div>
      {!zenMode && (
      <div
        className={`relative hidden h-full min-w-0 overflow-visible lg:flex ${
          sidebarOpen ? 'w-96 xl:w-[32rem]' : 'w-0'
        }`}
        style={sidebarStyle}
      >
        <div className="absolute left-0 top-1/2 z-20 flex -translate-y-1/2 -translate-x-[65%] flex-col gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-700 shadow-lg transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '<' : '>'}
          </button>
          {sidebarOpen ? (
            <button
              type="button"
              onClick={scrollSidebarToTop}
              aria-label="Back to top"
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-700 shadow-lg transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 ${
                sidebarScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-2'
              }`}
            >
              <SidebarArrowUpIcon className="h-6 w-6" />
            </button>
          ) : null}
        </div>
        {sidebarOpen ? (
          <div
            ref={sidebarScrollRef}
            className="flex h-full w-full flex-col overflow-y-auto bg-white p-6 shadow-lg dark:bg-zinc-900/95 dark:shadow-black/40"
          >
            <FoundSummary
              className="rounded-lg bg-white p-4 shadow-md dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-black/40"
              foundProportion={foundProportion}
              foundStationsPerLine={foundStationsPerLine}
              stationsPerLine={stationsPerLine}
              cityCompletionConfettiSeen={cityCompletionConfettiSeen}
              onCityCompletionConfettiSeen={markCityCompletionConfettiSeen}
              minimizable
              defaultMinimized
              highlightedLineId={highlightedLineId}
              iconBasePath={cityPath}
            />
            <hr className="my-4 w-full border-b border-zinc-100 dark:border-[#18181b]" />
            <FoundList
              found={found}
              idMap={idMap}
              setHoveredId={setHoveredId}
              hoveredId={hoveredId}
              hideLabels={hideLabels}
              foundTimestamps={foundTimestamps}
              zoomToFeature={zoomToFeature}
              onStationFocus={setActiveFoundId}
              activeStationId={activeFoundId}
              disabled={solutionsPromptOpen}
              iconBasePath={cityPath}
            />
          </div>
        ) : null}
      </div>
      )}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 flex flex-col bg-zinc-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          role="presentation"
        >
          <div
            className="mt-auto flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900 dark:text-zinc-100"
            onClick={(event) => event.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
          >
            <div className="relative flex-none px-6 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 sr-only">
                  {t('stationsFound')}
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  aria-label="Hide sidebar"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <FoundSummary
                className="mb-4 rounded-xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-[#18181b] dark:bg-zinc-800/80"
                foundProportion={foundProportion}
                foundStationsPerLine={foundStationsPerLine}
                stationsPerLine={stationsPerLine}
                cityCompletionConfettiSeen={cityCompletionConfettiSeen}
                onCityCompletionConfettiSeen={markCityCompletionConfettiSeen}
                highlightedLineId={highlightedLineId}
                iconBasePath={cityPath}
              />
              {relatedVersionsPanel ? (
                <div className="mb-4">
                  <MiniCityLinksPanel
                    title={relatedVersionsPanel.title}
                    description={relatedVersionsPanel.description}
                    items={relatedVersionsPanel.items}
                    currentSlug={relatedVersionsPanel.currentSlug}
                  />
                </div>
              ) : null}
              {customLayoutsPanel ? <div className="mb-4">{customLayoutsPanel}</div> : null}
              <FoundList
                found={found}
                idMap={idMap}
                setHoveredId={setHoveredId}
                hoveredId={hoveredId}
                hideLabels={hideLabels}
                foundTimestamps={foundTimestamps}
                zoomToFeature={zoomToFeature}
                onStationFocus={setActiveFoundId}
                activeStationId={activeFoundId}
                disabled={solutionsPromptOpen}
                iconBasePath={cityPath}
              />
            </div>
          </div>
        </div>
      )}
      <IntroModal
        inputRef={inputRef}
        open={isNewPlayer}
        setOpen={setIsNewPlayer}
      >
        {repairMojibakeString(t('introInstruction'))} {RETURN_SYMBOL}
      </IntroModal>
      {settingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm"
          onClick={closeSettingsModal}
        >
          <div
            className="mx-4 w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-[#18181b] dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t('settings')}
              </h2>
              <CloseButton onClick={closeSettingsModal} ariaLabel="Close settings" />
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Changes here are synced with the main site settings.
            </p>
            <SettingsPanel className="mt-4" showHeading={false} />
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link
                href="/?tab=settings"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-[#18181b] dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Open main page settings
              </Link>
              <button
                type="button"
                onClick={closeSettingsModal}
                className="inline-flex items-center justify-center rounded-full bg-[var(--accent-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:bg-[var(--accent-600)] dark:hover:bg-[var(--accent-500)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {accountModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm"
          onClick={closeAccountModal}
        >
          <div
            className="mx-4 w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-[#18181b] dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t('account')}
              </h2>
              <CloseButton onClick={closeAccountModal} ariaLabel="Close account" />
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage your Metro Memory account without leaving the map.
            </p>
            <div className="mt-4 max-h-[70vh] overflow-y-auto">
              <AccountDashboard showHeading={false} />
            </div>
          </div>
        </div>
      )}
      {privacyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm"
          onClick={closePrivacyModal}
        >
          <div
            className="mx-4 w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-[#18181b] dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {t('privacy')}
              </h2>
              <CloseButton onClick={closePrivacyModal} ariaLabel="Close privacy" />
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t('privacyModalSubtitle')}
            </p>
            <div className="mt-4 max-h-[70vh] overflow-y-auto">
              <PrivacyPanel />
            </div>
          </div>
        </div>
      )}
      <CityStatsPanel
        cityDisplayName={cityDisplayName}
        slug={CITY_NAME}
        cityPath={cityPath}
        open={cityStatsOpen}
        onClose={() => setCityStatsOpen(false)}
      />
      <MissedGuessInputsModal
        city={CITY_NAME}
        open={missedGuessInputsOpen}
        accessPassword={solutionsAccessPassword}
        onClose={() => setMissedGuessInputsOpen(false)}
      />
      {achievementToast && (
        <AchievementToast
          open
          slug={achievementToast.slug}
          cityName={achievementToast.cityName}
          title={achievementToast.title}
          description={achievementToast.description}
          durationMs={Math.max(3000, (settings.achievementToastDurationSec || 15) * 1000)}
          onClose={handleAchievementToastClose}
          onDontShowAgain={() => handleAchievementToastNever(achievementToast.slug)}
        />
      )}
      {resetConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-lg"
          onClick={handleResetCancel}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-progress-title"
            className="relative w-full max-w-[26rem] overflow-hidden rounded-3xl border border-white/15 bg-white/90 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/90"
            onClick={(event) => event.stopPropagation()}
            style={{ animation: 'resetDialogIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Animated gradient accent stripe */}
            <div
              className="h-1 w-full"
              style={{
                background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #ef4444)',
                backgroundSize: '200% 100%',
                animation: 'resetGradientShift 3s linear infinite',
              }}
            />

            <div className="relative px-7 pb-7 pt-6">
              {/* Icon with soft glow */}
              <div className="mb-5 flex justify-center">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400">
                  <div className="absolute inset-0 rounded-full bg-red-400/20 blur-lg dark:bg-red-500/20" />
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="relative h-7 w-7">
                    <path
                      d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.82A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.72-3.32l-7.4-12.82a2 2 0 0 0-3.46 0Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              </div>

              {/* Content — centered */}
              <div className="space-y-2 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-red-500/80 dark:text-red-400/80">
                  {t('resetProgress')}
                </p>
                <h2
                  id="reset-progress-title"
                  className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-white"
                >
                  {t('startOver')}?
                </h2>
                <p className="mx-auto max-w-[18rem] text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t('restartWarning')}
                </p>
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-zinc-200/80 dark:bg-zinc-700/50" />

              {/* Actions — Start over on the LEFT */}
              <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-all hover:shadow-lg hover:shadow-red-500/30 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-white active:scale-[0.97] dark:focus:ring-offset-zinc-900"
                >
                  {t('startOver')}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={handleResetCancel}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:ring-offset-2 focus:ring-offset-white active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:focus:ring-offset-zinc-900"
                >
                  {t('backToTheGame')}
                </button>
              </div>
            </div>
          </div>

          {/* Keyframe animations */}
          <style>{`
            @keyframes resetDialogIn {
              from { opacity: 0; transform: scale(0.92) translateY(12px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes resetGradientShift {
              0% { background-position: 0% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </div>
      )}
      {solutionsPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 dark:text-zinc-100"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {actionType === 'satellite'
                ? 'Show satellite'
                : actionType === 'mapNames'
                  ? 'Show map names'
                  : t('showSolutions')}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {actionType === 'satellite'
                ? 'Enter the password to view the satellite map.'
                : actionType === 'mapNames'
                  ? 'Enter the password to see map labels.'
                  : 'Enter the password to reveal every station.'}
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSolutionsSubmit}>
              <input
                type="password"
                autoFocus
                value={solutionsPassword}
                onChange={handleSolutionsPasswordChange}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-base text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-[var(--accent-400)] dark:focus:ring-[var(--accent-ring)]"
                placeholder="Password"
                autoComplete="off"
              />
              {solutionsError && (
                <p className="text-sm font-medium text-red-600">
                  Incorrect password. Try again.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSolutionsClose}
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {t('backToTheGame')}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 dark:bg-[var(--accent-600)] dark:hover:bg-[var(--accent-500)]"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {customModalOpen && (
        <CustomGameModal
          isOpen={customModalOpen}
          onCloseAction={() => setCustomModalOpen(false)}
          parentSlug={customLayoutParentSlug}
          iconBasePath={cityPath}
          initialLines={customEditing?.lines ?? null}
          initialTitle={customEditing?.title || null}
          editingLayoutId={customEditing?.id ?? null}
        />
      )}
    </div>
  )
}
