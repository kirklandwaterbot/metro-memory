'use client'

import { Transition } from '@headlessui/react'
import classNames from 'classnames'
import clsx from 'clsx'
import Fuse from 'fuse.js'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react'

import AccountDashboard from '@/app/(website)/account/panel'
import AchievementIcon from '@/components/AchievementIcon'
import { BackToTopButton } from '@/components/BackToTopButton'
import CitiesGlobe from '@/components/CitiesGlobe'
import CityCard, { CityCardVariant } from '@/components/CityCard'
import CloseButton from '@/components/CloseButton'
import CityStatsPanel from '@/components/CityStatsPanel'
import CollapsibleSection from '@/components/CollapsibleSection'
import CreditsContent from '@/components/CreditsContent'
import OverflowMarquee from '@/components/OverflowMarquee'
import PrivacyPanel from '@/components/PrivacyPanel'
import SettingsPanel from '@/components/SettingsPanel'
import { GitHubIcon } from '@/components/SocialIcons'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import useTranslation from '@/hooks/useTranslation'
import { getAchievementForCity, getMasterAchievementDefinition } from '@/lib/achievements'
import { formatAchievementDisplayMeta } from '@/lib/achievementDisplay'
import { getCityOpenGraphImagePath } from '@/lib/cityAssets'
import { formatLocalizedCityName } from '@/lib/cityNameDisplay'
import { ICity, cities, isCityDisabled as isCityDisabledFlag } from '@/lib/citiesConfig'
import { readLastPlayedCities, type LastPlayedCityEntry } from '@/lib/lastPlayedCities'
import { CITY_COORDINATES } from '@/lib/cityCoordinates'
import { formatDisplayCountryLabel } from '@/lib/countryNameDisplay'
import { getCountryCodeFromSlug, getFlagEmojiFromCountryCode } from '@/lib/countryFlags'
import { GLOBAL_ACHIEVEMENTS } from '@/lib/globalAchievements'
import { resolveI18nLocaleCode } from '@/lib/i18n'
import {
  UNAVAILABLE_CITY_ACCESS_EVENT,
  isPreviewUnlockableCity,
  readUnavailableCityAccess,
} from '@/lib/unavailableCityAccess'
import {
  MINI_CITIES,
  type MiniCityDefinition,
  type MiniCityStatsEntry,
  getMiniCityBySlug,
  getMiniCitiesForParent,
  isMiniCitySlug,
} from '@/lib/miniCities'
import {
    MdAutorenew,
    MdChat,
    MdClose,
    MdDarkMode,
    MdEmojiEvents,
    MdHistory,
    MdHome,
    MdInfo,
    MdLightMode,
    MdLocationCity,
    MdLock,
    MdMyLocation,
    MdNewspaper,
    MdPerson,
    MdPublic,
    MdSatellite,
    MdSettings,
    MdShuffle,
    MdFavorite,
    MdFavoriteBorder,
} from 'react-icons/md'

import { STATION_TOTALS } from '@/lib/stationTotals'


type CitySortOption =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'continent-asc'
  | 'continent-desc'
  | 'progress-not-played'
  | 'progress-played'
type AchievementSortOption =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'continent-asc'
  | 'continent-desc'
  | 'not-achieved-asc'
  | 'achieved-asc'
type HomeMapProvider = 'mapbox' | 'amap'

const CITY_SORT_OPTIONS: Array<{ value: CitySortOption; label: string }> = [
  { value: 'default', label: 'sortDefault' },
  { value: 'name-asc', label: 'sortNameAsc' },
  { value: 'name-desc', label: 'sortNameDesc' },
  { value: 'continent-asc', label: 'sortContinentAsc' },
  { value: 'continent-desc', label: 'sortContinentDesc' },
  { value: 'progress-not-played', label: 'sortNotPlayed' },
  { value: 'progress-played', label: 'sortPlayed' },
]

const ACHIEVEMENT_SORT_OPTIONS: Array<{ value: AchievementSortOption; label: string }> = [
  { value: 'default', label: 'sortDefault' },
  { value: 'name-asc', label: 'sortNameAsc' },
  { value: 'name-desc', label: 'sortNameDesc' },
  { value: 'continent-asc', label: 'sortContinentAsc' },
  { value: 'continent-desc', label: 'sortContinentDesc' },
  { value: 'not-achieved-asc', label: 'sortNotAchieved' },
  { value: 'achieved-asc', label: 'sortAchievedInOrder' },
]

const CITY_VIEW_OPTIONS: Array<{ value: CityCardVariant; label: string }> = [
  { value: 'globe', label: 'cityViewGlobe' },
  { value: 'map', label: 'cityViewMap' },
  { value: 'comfortable', label: 'cityViewComfortable' },
  { value: 'compact', label: 'cityViewCompact' },
  { value: 'cover', label: 'cityViewCover' },
  { value: 'list', label: 'cityViewList' },
]

const CITY_VIEW_MODE_STORAGE_KEY = 'city-view-mode'
const CITY_VIEW_SATELLITE_STORAGE_KEY = 'city-view-satellite'
const HOME_MAP_PROVIDER_STORAGE_KEY = 'home-map-provider'
const CONTINENT_NAV_OPEN_STORAGE_KEY = 'continent-nav-open'
const HOME_ACTIVE_TAB_STORAGE_KEY = 'home-active-tab'
const HOME_SCROLL_STORAGE_PREFIX = 'home-scroll-'
const TAB_DEBUG_STORAGE_KEY = 'metro-memory-debug-tabs'
const isValidHomeMapProvider = (
  value: string | null | undefined,
): value is HomeMapProvider => value === 'mapbox' || value === 'amap'

const TAB_OPTIONS: Array<{ id: TabOption; label: string }> = [
  { id: 'cities', label: 'tabCities' },
  { id: 'achievements', label: 'tabAchievements' },
  { id: 'updateLog', label: 'tabUpdateLog' },
  { id: 'account', label: 'tabAccount' },
  { id: 'globalStats', label: 'tabGlobalStats' },
  { id: 'settings', label: 'tabSettings' },
  { id: 'credits', label: 'tabCredits' },
  { id: 'privacy', label: 'tabPrivacy' },
  { id: 'testimonials', label: 'tabTestimonials' },
  { id: 'press', label: 'tabPress' },
]
const SECONDARY_TAB_IDS = new Set<TabOption>([
  'credits',
  'privacy',
  'testimonials',
  'press',
  'home',
])
const PRIMARY_TABS = TAB_OPTIONS.filter(({ id }) => !SECONDARY_TAB_IDS.has(id))
const SECONDARY_TABS = TAB_OPTIONS.filter(({ id }) => SECONDARY_TAB_IDS.has(id))
type TabOption =
  | 'cities'
  | 'achievements'
  | 'updateLog'
  | 'credits'
  | 'testimonials'
  | 'press'
  | 'settings'
  | 'account'
  | 'globalStats'
  | 'privacy'
  | 'home'

type PersistedHomeTab = Exclude<TabOption, 'home'>

const isPersistedHomeTab = (value: TabOption): value is PersistedHomeTab =>
  value !== 'home'

const TAB_ICONS: Record<TabOption, React.ElementType> = {
  cities: MdLocationCity,
  achievements: MdEmojiEvents,
  updateLog: MdHistory,
  account: MdPerson,
  globalStats: MdPublic,
  settings: MdSettings,
  credits: MdInfo,
  privacy: MdLock,
  testimonials: MdChat,
  press: MdNewspaper,
  home: MdHome,
}

type SidebarRouteItem = {
  href: string
  label: string
  icon: React.ElementType
  match: (pathname: string) => boolean
}

const SIDEBAR_ROUTE_ITEMS: SidebarRouteItem[] = []

type UpdateLogStatus = 'idle' | 'loading' | 'success' | 'error'

type UpdateLogEntry = {
  sha: string
  message: string
  author: string
  date?: string
  url: string
}

type UpdateLogState = {
  status: UpdateLogStatus
  entries: UpdateLogEntry[]
  errorMessage?: string
  lastUpdated?: string
}

type SidebarTooltipState = {
  label: string
  top: number
}

type GithubCommitResponse = {
  sha?: string
  html_url?: string
  commit?: {
    message?: string
    author?: { name?: string; date?: string | null }
    committer?: { date?: string | null }
  }
  author?: { login?: string | null }
}

const UPDATE_LOG_ENDPOINT =
  'https://api.github.com/repos/kirklandwaterbot/metro-memory/commits?per_page=20'

const UPDATE_LOG_HEADERS: HeadersInit = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

const UPDATE_LOG_LIMIT = 15
const UPDATE_LOG_TIMEOUT_MS = 5_000
const COLLAPSIBLE_CONTINENTS = new Set([
  'North America',
  'Europe',
  'Asia',
  'Oceania',
])

const CONTINENT_ORDER = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Australia',
  'Africa',
  'Oceania',
  'Antarctica',
]

const CONTINENT_LABEL_KEYS: Record<string, string> = {
  'North America': 'northAmerica',
  'South America': 'southAmerica',
  Europe: 'europe',
  Asia: 'asia',
  Australia: 'australia',
  Africa: 'africa',
  Oceania: 'oceania',
  Antarctica: 'antarctica',
}

const getContinentSectionId = (continent: string) => {
  const slug = continent
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug ? `continent-${slug}` : 'continent-unknown'
}

const getCountrySectionId = (continent: string, country: string) => {
  const continentSlug = continent
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const countrySlug = country
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!continentSlug || !countrySlug) {
    return `continent-${continentSlug || 'unknown'}-country-${countrySlug || 'unknown'}`
  }
  return `continent-${continentSlug}-country-${countrySlug}`
}

const formatCommitMessage = (message?: string | null) => {
  if (!message) {
    return 'No commit message'
  }
  const firstLine = message.split('\n')[0]?.trim()
  return firstLine && firstLine.length > 0 ? firstLine : 'No commit message'
}

const getFavoritesStorageKey = (userId?: string | null) =>
  `${FAVORITES_STORAGE_PREFIX}-${userId || 'anon'}`

const REGION_KEYWORDS: Record<string, string[]> = {
  AL: ['Alabama', 'AL'],
  AK: ['Alaska', 'AK'],
  AZ: ['Arizona', 'AZ'],
  AR: ['Arkansas', 'AR'],
  CA: ['California', 'CA'],
  CO: ['Colorado', 'CO'],
  CT: ['Connecticut', 'CT'],
  DE: ['Delaware', 'DE'],
  FL: ['Florida', 'FL'],
  GA: ['Georgia', 'GA'],
  HI: ['Hawaii', 'HI'],
  ID: ['Idaho', 'ID'],
  IL: ['Illinois', 'IL'],
  IN: ['Indiana', 'IN'],
  IA: ['Iowa', 'IA'],
  KS: ['Kansas', 'KS'],
  KY: ['Kentucky', 'KY'],
  LA: ['Louisiana', 'LA'],
  ME: ['Maine', 'ME'],
  MD: ['Maryland', 'MD'],
  MA: ['Massachusetts', 'MA'],
  MI: ['Michigan', 'MI'],
  MN: ['Minnesota', 'MN'],
  MS: ['Mississippi', 'MS'],
  MO: ['Missouri', 'MO'],
  MT: ['Montana', 'MT'],
  NE: ['Nebraska', 'NE'],
  NV: ['Nevada', 'NV'],
  NH: ['New Hampshire', 'NH'],
  NJ: ['New Jersey', 'NJ'],
  NM: ['New Mexico', 'NM'],
  NY: ['New York', 'NY'],
  NC: ['North Carolina', 'NC'],
  ND: ['North Dakota', 'ND'],
  OH: ['Ohio', 'OH'],
  OK: ['Oklahoma', 'OK'],
  OR: ['Oregon', 'OR'],
  PA: ['Pennsylvania', 'PA'],
  RI: ['Rhode Island', 'RI'],
  SC: ['South Carolina', 'SC'],
  SD: ['South Dakota', 'SD'],
  TN: ['Tennessee', 'TN'],
  TX: ['Texas', 'TX'],
  UT: ['Utah', 'UT'],
  VT: ['Vermont', 'VT'],
  VA: ['Virginia', 'VA'],
  WA: ['Washington', 'WA'],
  WV: ['West Virginia', 'WV'],
  WI: ['Wisconsin', 'WI'],
  WY: ['Wyoming', 'WY'],
  DC: ['District of Columbia', 'DC', 'Washington DC'],
  PR: ['Puerto Rico', 'PR'],
  MX: ['Mexico', 'MX'],
  CAN: ['Canada', 'CAN'],
  AB: ['Alberta', 'AB'],
  BC: ['British Columbia', 'BC'],
  MB: ['Manitoba', 'MB'],
  NB: ['New Brunswick', 'NB'],
  NL: ['Newfoundland and Labrador', 'NL'],
  NS: ['Nova Scotia', 'NS'],
  NT: ['Northwest Territories', 'NT'],
  NU: ['Nunavut', 'NU'],
  ON: ['Ontario', 'ON'],
  PE: ['Prince Edward Island', 'PE'],
  QC: ['Quebec', 'QC'],
  SK: ['Saskatchewan', 'SK'],
  YT: ['Yukon', 'YT'],
  USA: ['United States', 'USA', 'US', 'America'],
}

const extractRegionKeywords = (name: string): string[] | undefined => {
  const match = name.match(/,\s*([A-Z]{2,3}(?:\/[A-Z]{2,3})*)/)
  if (!match) return undefined
  const codes = match[1].split('/')
  const keywords = new Set<string>()
  for (const code of codes) {
    const list = REGION_KEYWORDS[code]
    if (list) {
      list.forEach((word) => {
        keywords.add(word)
        keywords.add(word.toLowerCase())
      })
    }
  }
  return keywords.size > 0 ? Array.from(keywords) : undefined
}

const enrichCities = (cityList: ICity[]): ICity[] =>
  cityList.map((city) => {
    if (city.keywords && city.keywords.length > 0) {
      return city
    }
    const keywords = extractRegionKeywords(city.name)
    return keywords ? { ...city, keywords } : city
  })

const getPathFromLink = (link: string) => {
  if (!link.startsWith('/')) {
    return null
  }
  return link.replace(/^\//, '').split(/[?#]/)[0]
}

const getSlugFromLink = (link: string) => {
  const path = getPathFromLink(link)
  if (!path) {
    return null
  }
  const segments = path.split('/').filter(Boolean)
  return segments.length ? segments[segments.length - 1] : null
}

const getCountryFromLink = (link: string) => {
  const path = getPathFromLink(link)
  if (!path) {
    return null
  }
  const segments = path.split('/').filter(Boolean)
  return segments.length >= 2 ? segments[1] : null
}

const getDisplayedCityCounts = (cityList: ICity[]) =>
  cityList.reduce(
    (counts, city) => {
      const slug = getSlugFromLink(city.link)
      if (isMiniCitySlug(slug)) {
        counts.miniCityCount += 1
      } else {
        counts.cityCount += 1
      }
      return counts
    },
    { cityCount: 0, miniCityCount: 0 },
  )

const COUNTRY_LABEL_OVERRIDES: Record<string, string> = {
  usa: 'USA',
  uk: 'UK',
  uae: 'UAE',
  'south-korea': 'South Korea',
  'north-korea': 'North Korea',
  'new-zealand': 'New Zealand',
  global: 'Main',
  'secret-fun': 'Secret & Fun',
}

const COUNTRY_FLAG_ISO_CODES: Record<string, string> = {
  usa: 'US',
  canada: 'CA',
  mexico: 'MX',
  uk: 'GB',
  ireland: 'IE',
  france: 'FR',
  germany: 'DE',
  spain: 'ES',
  italy: 'IT',
  austria: 'AT',
  sweden: 'SE',
  hungary: 'HU',
  turkey: 'TR',
  australia: 'AU',
  'new-zealand': 'NZ',
  china: 'CN',
  japan: 'JP',
  'south-korea': 'KR',
  'north-korea': 'KP',
  singapore: 'SG',
  taiwan: 'TW',
  malaysia: 'MY',
  indonesia: 'ID',
  vietnam: 'VN',
  thailand: 'TH',
  philippines: 'PH',
  uae: 'AE',
  'united-arab-emirates': 'AE',
  argentina: 'AR',
  venezuela: 'VE',
  brazil: 'BR',
  'south-africa': 'ZA',
  algeria: 'DZ',
}

const FALLBACK_COUNTRY_FLAG = String.fromCodePoint(0x1f310)

const formatCountryLabel = (slug: string | null, language?: string) => {
  const localized = formatDisplayCountryLabel(slug, language)
  if (localized) {
    return localized
  }
  if (!slug) {
    return 'Unknown'
  }
  if (COUNTRY_LABEL_OVERRIDES[slug]) {
    return COUNTRY_LABEL_OVERRIDES[slug]
  }
  return slug
      .split('-')
      .map((chunk) => (chunk ? chunk[0].toUpperCase() + chunk.slice(1) : chunk))
      .join(' ')
}

const formatAchievementCountryLabel = (
  slug: string | null,
  language?: string,
) => {
  return formatCountryLabel(slug, language)
}

const formatAchievementContinentLabel = (
  continent: string,
  t: (key: string, params?: Record<string, unknown>) => string,
) => {
  if (continent === 'Global') {
    return t('achievementCategoryGlobal')
  }
  return CONTINENT_LABEL_KEYS[continent] !== undefined
    ? t(CONTINENT_LABEL_KEYS[continent])
    : continent
}

const getCountryFlagEmoji = (slug: string | null) => {
  if (!slug) {
    return FALLBACK_COUNTRY_FLAG
  }

  const countryCode = COUNTRY_FLAG_ISO_CODES[slug] ?? getCountryCodeFromSlug(slug)
  return countryCode ? getFlagEmojiFromCountryCode(countryCode) : FALLBACK_COUNTRY_FLAG
}

interface AchievementMeta {
  slug: string
  cityName: string
  title: string
  description: string
  secretDescription?: string
  continent: string
  country: string
  order: number
  iconSrc?: string
}

type AchievementCountryGroup = {
  country: string
  entries: AchievementMeta[]
}

type AchievementContinentGroup = {
  continent: string
  countries: AchievementCountryGroup[]
}

type SearcheableCitiesListProps = {
  testimonialsContent?: ReactNode
  pressContent?: ReactNode
}

type AchievementMetrics = {
  playDays: number
  playMonths: number
  globalStations: number
  lineMasterKeys: number
  mapNamesToggles: number
  favoritesCompleted: number
  uniqueCities: number
  uniqueContinents: number
}

const DEFAULT_ACHIEVEMENT_METRICS: AchievementMetrics = {
  playDays: 0,
  playMonths: 0,
  globalStations: 0,
  lineMasterKeys: 0,
  mapNamesToggles: 0,
  favoritesCompleted: 0,
  uniqueCities: 0,
  uniqueContinents: 0,
}

type AchievementProgressData = {
  current: number
  target: number
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const mixChannel = (start: number, end: number, t: number) =>
  Math.round(start + (end - start) * clamp01(t))

const toRadians = (value: number) => (value * Math.PI) / 180

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const rLat1 = toRadians(lat1)
  const rLat2 = toRadians(lat2)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2
  return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const getGradientColor = (percent: number) => {
  const t = clamp01(percent)
  const hue = 120 * t // 0 = red, 120 = green
  const saturation = mixChannel(75, 65, t) // slightly dial back saturation toward green
  return `hsl(${hue}deg, ${saturation}%, 50%)`
}

const getBarBackground = (percent: number) => {
  const midColor = getGradientColor(percent)
  return `linear-gradient(90deg, ${midColor} 0%, ${midColor} 100%)`
}

const HIDDEN_CITY_SLUGS = new Set([
  'viarail',
  'bengbu',
  'guangan',
  'guilin',
  'jining',
  'xishui',
  'yinchuan',
  'zhangjiakou',
  'zhangye',
])

const FAVORITES_STORAGE_PREFIX = 'favorites-v1'

type GlobalStats = {
  totalStationsFound: number
  totalStations: number
  percentFound: number
  cityBreakdown: Array<{
    slug: string
    name: string
    percent: number
    found: number
    total: number
  }>
  completedCities: number
  partialCities: number
  notStartedCities: number
  continentBreakdown: Array<{
    continent: string
    percent: number
    found: number
    total: number
    cityCount: number
  }>
  miniTotalStationsFound: number
  miniTotalStations: number
  miniPercentFound: number
  miniCityBreakdown: MiniCityStatsEntry[]
  miniCompletedCities: number
  miniPartialCities: number
  miniNotStartedCities: number
  miniContinentBreakdown: Array<{
    continent: string
    percent: number
    found: number
    total: number
    cityCount: number
  }>
}

const SearcheableCitiesList = ({
  testimonialsContent,
  pressContent,
}: SearcheableCitiesListProps) => {
  const searchParams = useSearchParams()
  const tabDebugEnabledRef = useRef(false)
  const [activeTab, setActiveTab] = useState<TabOption>('cities')
  const [search, setSearch] = useState('')
  const [continentNavOpen, setContinentNavOpen] = useState(true)
  const [collapsedContinents, setCollapsedContinents] = useState<Record<string, boolean>>({})
  const [citySort, setCitySort] = useState<CitySortOption>('default')
  const [globalStatsSearch, setGlobalStatsSearch] = useState('')
  const [globalStatsSort, setGlobalStatsSort] = useState<CitySortOption>('default')
  const [cityViewMode, setCityViewMode] = useState<CityCardVariant>('map')
  const [isSatellite, setIsSatellite] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [mapProvider, setMapProvider] = useState<HomeMapProvider>('mapbox')
  const [achievementSearch, setAchievementSearch] = useState('')
  const [achievementSort, setAchievementSort] = useState<AchievementSortOption>('name-asc')
  const [unlockedData, setUnlockedData] = useState<Map<string, number>>(new Map())
  const [achievementMetrics, setAchievementMetrics] = useState<AchievementMetrics>(
    DEFAULT_ACHIEVEMENT_METRICS,
  )
  const [recommendedSlugs, setRecommendedSlugs] = useState<string[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const { settings, requestInMainlandChina } = useSettings()
  const debugMapProviderEnabled = searchParams?.get('debugMapProvider') === '1'
  const canToggleHomeMapProvider = requestInMainlandChina || debugMapProviderEnabled
  const { t } = useTranslation()
  const getLabel = (key: string, fallback: string) => {
    const value = t(key)
    return typeof value === 'string' && value !== key ? value : fallback
  }
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [viewportWidth, setViewportWidth] = useState<number>(0)

  // Wait for hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const updateViewportWidth = () => setViewportWidth(window.innerWidth)
    updateViewportWidth()
    window.addEventListener('resize', updateViewportWidth)
    return () => window.removeEventListener('resize', updateViewportWidth)
  }, [])
  const [updateLogState, setUpdateLogState] = useState<UpdateLogState>({
    status: 'idle',
    entries: [],
  })
  const { user, progressSummaries, uiPreferences, updateUiPreferences } = useAuth()
  const [cityProgress, setCityProgress] = useState<Record<string, number>>({})
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalStationsFound: 0,
    totalStations: 0,
    percentFound: 0,
    cityBreakdown: [],
    completedCities: 0,
    partialCities: 0,
    notStartedCities: 0,
    continentBreakdown: [],
    miniTotalStationsFound: 0,
    miniTotalStations: 0,
    miniPercentFound: 0,
    miniCityBreakdown: [],
    miniCompletedCities: 0,
    miniPartialCities: 0,
    miniNotStartedCities: 0,
    miniContinentBreakdown: [],
  })
  const [statsOpen, setStatsOpen] = useState(false)
  const [statsSlug, setStatsSlug] = useState<string | null>(null)
  const [statsPath, setStatsPath] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [continentFocus, setContinentFocus] = useState<{ name: string; token: number } | null>(
    null,
  )
  const [countryFocus, setCountryFocus] = useState<{ name: string; token: number } | null>(null)
  const [favoriteSlugs, setFavoriteSlugs] = useState<Set<string>>(new Set())

  const recentCities = useMemo(() => {
    if (typeof window === 'undefined') return []
    const played = readLastPlayedCities()
    if (played.length === 0) return []
    return played
      .map((entry) => {
        const city = cities.find((c) => {
          const s = getSlugFromLink(c.link)
          return s === entry.slug
        })
        return city ?? null
      })
      .filter((c): c is ICity => c !== null)
      .slice(0, 8)
  }, [cities])
  const [hasUnavailableCityAccess, setHasUnavailableCityAccess] = useState(false)
  const [favoriteToast, setFavoriteToast] = useState<{ message: string; ts: number } | null>(null)
  const viewPrefsHydratedRef = useRef(false)
  const mapProviderHydratedRef = useRef(false)
  const navPrefsHydratedRef = useRef(false)
  const tabPrefsHydratedRef = useRef(false)
  const suppressActiveUntilRef = useRef<number>(0)
  const mapSectionRef = useRef<HTMLDivElement | null>(null)
  const scrollMapSectionToCenter = useCallback(() => {
    if (typeof window === 'undefined') return
    const mapSection = mapSectionRef.current
    if (!mapSection) return
    const rect = mapSection.getBoundingClientRect()
    const absoluteTop = window.scrollY + rect.top
    const targetTop = Math.max(0, absoluteTop + rect.height / 2 - window.innerHeight / 2)
    window.scrollTo({ top: targetTop, behavior: 'smooth' })
  }, [])

  // Load favorites from localStorage (per user/anon)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = getFavoritesStorageKey(user?.id)
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setFavoriteSlugs(new Set(parsed.filter((slug) => typeof slug === 'string')))
        }
      } else {
        setFavoriteSlugs(new Set())
      }
    } catch {
      setFavoriteSlugs(new Set())
    }
  }, [user?.id])

  const persistFavorites = useCallback(
    (next: Set<string>) => {
      if (typeof window === 'undefined') return
      const key = getFavoritesStorageKey(user?.id)
      window.localStorage.setItem(key, JSON.stringify(Array.from(next)))
    },
    [user?.id],
  )

  const toggleFavorite = useCallback(
    (slug: string, next: boolean) => {
      setFavoriteSlugs((prev) => {
        const updated = new Set(prev)
        if (next) {
          updated.add(slug)
        } else {
          updated.delete(slug)
        }
        persistFavorites(updated)
        return updated
      })
      setFavoriteToast({
        message: next ? 'Added to favorites' : 'Removed from favorites',
        ts: Date.now(),
      })
    },
    [persistFavorites],
  )

  useEffect(() => {
    if (!favoriteToast) return
    const timeout = window.setTimeout(() => setFavoriteToast(null), 2400)
    return () => window.clearTimeout(timeout)
  }, [favoriteToast])


  useEffect(() => {
    if (typeof window === 'undefined') return

    const refreshAccess = () => setHasUnavailableCityAccess(readUnavailableCityAccess())
    refreshAccess()
    window.addEventListener('storage', refreshAccess)
    window.addEventListener(UNAVAILABLE_CITY_ACCESS_EVENT, refreshAccess)
    return () => {
      window.removeEventListener('storage', refreshAccess)
      window.removeEventListener(UNAVAILABLE_CITY_ACCESS_EVENT, refreshAccess)
    }
  }, [])

  const isPreviewCityUnlocked = useCallback(
    (city: Pick<ICity, 'link'>) => {
      const slug = getSlugFromLink(city.link)
      return isPreviewUnlockableCity(slug) && hasUnavailableCityAccess
    },
    [hasUnavailableCityAccess],
  )

  const isCityDisabledForPreview = useCallback(
    (city: Pick<ICity, 'disabled' | 'hideInStats' | 'link'>) =>
      isCityDisabledFlag(city) && !isPreviewCityUnlocked(city),
    [isPreviewCityUnlocked],
  )
  const filteredCities = useMemo(
    () =>
      cities.filter((city) => {
        const slug = getSlugFromLink(city.link)
        return slug ? !HIDDEN_CITY_SLUGS.has(slug) : true
      }),
    [],
  )

  const focusContinentOnMap = useCallback(
    (continent: string) => {
      if (cityViewMode === 'globe' || cityViewMode === 'map') {
        scrollMapSectionToCenter()
        setContinentFocus({ name: continent, token: Date.now() })
      }
    },
    [cityViewMode, scrollMapSectionToCenter],
  )

  const focusCountryOnMap = useCallback(
    (country: string) => {
      if (cityViewMode === 'globe' || cityViewMode === 'map') {
        scrollMapSectionToCenter()
        setCountryFocus({ name: country, token: Date.now() })
      }
    },
    [cityViewMode, scrollMapSectionToCenter],
  )



  const enrichedCities = useMemo(() => {
    const baseCities = enrichCities(filteredCities)
    return baseCities.map((city) => {
      const slug = getSlugFromLink(city.link)
      const localizedName = formatLocalizedCityName(
        city.name,
        slug ?? city.link,
        settings.language,
      )
      if (!slug) {
        return {
          ...city,
          name: localizedName,
        }
      }
      const mergedKeywords = new Set(city.keywords ?? [])
      if (localizedName !== city.name) {
        mergedKeywords.add(city.name)
      }
      const miniCities = getMiniCitiesForParent(slug)
      if (miniCities.length === 0) {
        return {
          ...city,
          name: localizedName,
          keywords: Array.from(mergedKeywords),
        }
      }
      miniCities.forEach((miniCity) => {
        mergedKeywords.add(miniCity.name)
        mergedKeywords.add(
          formatLocalizedCityName(miniCity.name, miniCity.slug, settings.language),
        )
        miniCity.keywords.forEach((keyword) => mergedKeywords.add(keyword))
      })
      return {
        ...city,
        name: localizedName,
        keywords: Array.from(mergedKeywords),
      }
    })
  }, [filteredCities, settings.language])
  const recommendedSet = useMemo(() => new Set(recommendedSlugs), [recommendedSlugs])
  const isMapView = cityViewMode === 'globe' || cityViewMode === 'map'
  const cityAchievementCatalog = useMemo(() => {
    return enrichedCities
      .filter((city) => !isCityDisabledForPreview(city))
      .map((city, index) => {
        const slug = getSlugFromLink(city.link)
        if (!slug) return null
        const baseName = city.name.split(',')[0]
        const meta = getAchievementForCity(slug, baseName)
        return {
          slug,
          cityName: baseName,
          title: meta.title,
          description: meta.description,
          continent: city.continent,
          country: getCountryFromLink(city.link) ?? 'unknown',
          order: index,
        }
      })
      .filter((entry): entry is AchievementMeta => entry !== null)
  }, [enrichedCities])
  const miniCityAchievementCatalog = useMemo(() => {
    return MINI_CITIES.map((miniCity, index) => {
      const meta = getAchievementForCity(miniCity.slug, miniCity.name)
      return {
        slug: miniCity.slug,
        cityName: miniCity.name,
        title: meta.title,
        description: meta.description,
        continent: miniCity.continent,
        country: miniCity.country,
        order: index,
      }
    })
  }, [])
  const cityMetaBySlug = useMemo(() => {
    const map = new Map<string, ICity>()
    enrichedCities.forEach((city) => {
      const slug = getSlugFromLink(city.link)
      if (slug) {
        map.set(slug, city)
      }
    })
    return map
  }, [enrichedCities])
  const miniCitiesByParentSlug = useMemo(() => {
    const map = new Map<string, MiniCityDefinition[]>()
    MINI_CITIES.forEach((miniCity) => {
      const existing = map.get(miniCity.parentSlug)
      if (existing) {
        existing.push(miniCity)
      } else {
        map.set(miniCity.parentSlug, [miniCity])
      }
    })
    return map
  }, [])
  const miniCityMetaBySlug = useMemo(
    () => new Map(MINI_CITIES.map((entry) => [entry.slug, entry])),
    [],
  )
  const getCityFamilySlug = useCallback(
      (slug: string | null) => {
        if (!slug) {
          return null
      }
      const miniCity = miniCityMetaBySlug.get(slug)
      if (miniCity) {
        return miniCity.parentSlug
      }
      return getMiniCitiesForParent(slug).length > 0 ? slug : null
      },
    [miniCityMetaBySlug],
  )
  const gridColumnCount = useMemo(() => {
    if (cityViewMode === 'list' || cityViewMode === 'map' || cityViewMode === 'globe') {
      return 1
    }
    if (cityViewMode === 'cover') {
      if (viewportWidth >= 1280) return 3
      if (viewportWidth >= 768) return 2
      return 1
    }
    if (cityViewMode === 'compact') {
      if (viewportWidth >= 1280) return 5
      if (viewportWidth >= 1024) return 4
      if (viewportWidth >= 640) return 2
      return 1
    }
    if (viewportWidth >= 1280) return 4
    if (viewportWidth >= 1024) return 3
    if (viewportWidth >= 768) return 2
    return 1
  }, [cityViewMode, viewportWidth])
  const isDark = resolvedTheme === 'dark'
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarTooltip, setSidebarTooltip] = useState<SidebarTooltipState | null>(null)
  const logTabDebug = useCallback((event: string, details?: Record<string, unknown>) => {
    if (!tabDebugEnabledRef.current || typeof window === 'undefined') {
      return
    }
    console.debug(`[MetroMemory tabs] ${event}`, {
      ...details,
      href: window.location.href,
    })
  }, [])
  const navigateToTab = useCallback(
    (tab: TabOption) => {
      logTabDebug('navigateToTab', {
        from: activeTab,
        to: tab,
      })
      const nextQuery = `tab=${tab}`
      router.replace(`/?${nextQuery}`, { scroll: false })
    },
    [activeTab, logTabDebug, router],
  )
  const navigateToHomeTab = useCallback(() => {
    navigateToTab('cities')
  }, [navigateToTab])
  const showSidebarTooltip = useCallback((label: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    setSidebarTooltip({
      label,
      top: rect.top + rect.height / 2,
    })
  }, [])
  const hideSidebarTooltip = useCallback(() => {
    setSidebarTooltip((current) => (current ? null : current))
  }, [])

  const masterAchievement = useMemo<AchievementMeta>(() => {
    const totalCities = cityAchievementCatalog.length
    const def = getMasterAchievementDefinition(totalCities)
    return {
      slug: 'metro-memory-master',
      cityName: 'Metro Memory',
      title: def.title,
      description: def.description,
      continent: 'Global',
      country: 'global',
      order: Number.MAX_SAFE_INTEGER,
      iconSrc: '/icon.ico',
    }
  }, [cityAchievementCatalog.length])

  const extraAchievements: AchievementMeta[] = useMemo(
    () =>
      GLOBAL_ACHIEVEMENTS.map((entry) => ({
        slug: entry.slug,
        cityName: entry.country === 'secret-fun' ? 'Secret & Fun' : 'Main',
        title: entry.title,
        description: entry.description,
        secretDescription: entry.secretDescription,
        continent: 'Global',
        country: entry.country ?? 'global',
        order: entry.order,
        iconSrc: '/icon.ico',
      })),
    [],
  )

  const achievementCatalog = useMemo(
    () => [masterAchievement, ...extraAchievements, ...cityAchievementCatalog],
    [cityAchievementCatalog, extraAchievements, masterAchievement],
  )
  const combinedAchievementCatalog = useMemo(
    () => [...achievementCatalog, ...miniCityAchievementCatalog],
    [achievementCatalog, miniCityAchievementCatalog],
  )

  const fuse = useMemo(
    () =>
      new Fuse(enrichedCities, {
        keys: ['name', 'keywords'],
        minMatchCharLength: 1,
        threshold: 0.3,
        distance: 100,
        ignoreLocation: true,
      }),
    [enrichedCities],
  )

  const achievementFuse = useMemo(
    () =>
      new Fuse(combinedAchievementCatalog, {
        keys: ['cityName', 'title', 'description', 'slug', 'continent', 'country'],
        minMatchCharLength: 1,
        threshold: 0.35,
        distance: 100,
        ignoreLocation: true,
      }),
    [combinedAchievementCatalog],
  )

  const computeCityProgress = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    const next: Record<string, number> = {}
    const breakdown: GlobalStats['cityBreakdown'] = []
    const miniBreakdown: GlobalStats['miniCityBreakdown'] = []
    let totalStations = 0
    let totalFound = 0
    let completedCities = 0
    let partialCities = 0
    let notStartedCities = 0
    let miniTotalStations = 0
    let miniTotalFound = 0
    let miniCompletedCities = 0
    let miniPartialCities = 0
    let miniNotStartedCities = 0
    const continentTotals = new Map<
      string,
      { found: number; total: number; cityCount: number }
    >()
    const miniContinentTotals = new Map<
      string,
      { found: number; total: number; cityCount: number }
    >()

    const readFoundCount = (slug: string) => {
      let foundCount = 0
      const stored = window.localStorage.getItem(`${slug}-stations`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            foundCount = new Set(parsed.filter((value) => typeof value === 'number')).size
          } else if (typeof parsed === 'number') {
            foundCount = parsed
          }
        } catch {
          foundCount = 0
        }
      }
      const remoteFound = progressSummaries[slug]
      if (typeof remoteFound === 'number') {
        foundCount = remoteFound
      }
      return foundCount
    }

    enrichedCities.forEach((city) => {
      const slug = getSlugFromLink(city.link)
      if (!slug) {
        return
      }
      const totalRaw = window.localStorage.getItem(`${slug}-station-total`)
      const total = Number(totalRaw)
      const storedStationTotal = Number.isFinite(total) && total > 0 ? total : null
      const fallbackStationTotal = STATION_TOTALS[slug]
      const cityStationTotal =
        storedStationTotal ??
        (typeof fallbackStationTotal === 'number' && fallbackStationTotal > 0
          ? fallbackStationTotal
          : null)
      const foundCount = readFoundCount(slug)
      let ratio = 0
      if (cityStationTotal && cityStationTotal > 0) {
        ratio = Math.max(0, Math.min(1, foundCount / cityStationTotal))
      } else if (foundCount > 0) {
        ratio = 1
      }
      next[slug] = ratio

      const cityTotalStations = cityStationTotal ?? foundCount
      totalStations += cityTotalStations
      totalFound += Math.min(foundCount, cityTotalStations)

      if (ratio >= 1) {
        completedCities += 1
      } else if (ratio > 0) {
        partialCities += 1
      } else {
        notStartedCities += 1
      }

      const continent = city.continent || 'Unknown'
      const existing = continentTotals.get(continent) ?? { found: 0, total: 0, cityCount: 0 }
      continentTotals.set(continent, {
        found: existing.found + Math.min(foundCount, cityTotalStations),
        total: existing.total + cityTotalStations,
        cityCount: existing.cityCount + 1,
      })

      breakdown.push({
        slug,
        name: city.name,
        percent: ratio,
        found: foundCount,
        total: cityTotalStations,
      })
    })

    MINI_CITIES.forEach((miniCity) => {
      const slug = miniCity.slug
      const totalRaw = window.localStorage.getItem(`${slug}-station-total`)
      const total = Number(totalRaw)
      const storedStationTotal = Number.isFinite(total) && total > 0 ? total : null
      const fallbackStationTotal = STATION_TOTALS[slug]
      const cityStationTotal =
        storedStationTotal ??
        (typeof fallbackStationTotal === 'number' && fallbackStationTotal > 0
          ? fallbackStationTotal
          : null)
      const foundCount = readFoundCount(slug)
      let ratio = 0
      if (cityStationTotal && cityStationTotal > 0) {
        ratio = Math.max(0, Math.min(1, foundCount / cityStationTotal))
      } else if (foundCount > 0) {
        ratio = 1
      }
      next[slug] = ratio

      const miniCityTotalStations = cityStationTotal ?? foundCount
      miniTotalStations += miniCityTotalStations
      miniTotalFound += Math.min(foundCount, miniCityTotalStations)

      if (ratio >= 1) {
        miniCompletedCities += 1
      } else if (ratio > 0) {
        miniPartialCities += 1
      } else {
        miniNotStartedCities += 1
      }

      const existing = miniContinentTotals.get(miniCity.continent) ?? {
        found: 0,
        total: 0,
        cityCount: 0,
      }
      miniContinentTotals.set(miniCity.continent, {
        found: existing.found + Math.min(foundCount, miniCityTotalStations),
        total: existing.total + miniCityTotalStations,
        cityCount: existing.cityCount + 1,
      })

      miniBreakdown.push({
        slug,
        name: miniCity.name,
        parentSlug: miniCity.parentSlug,
        parentName: miniCity.parentName,
        link: miniCity.link,
        percent: ratio,
        found: foundCount,
        total: miniCityTotalStations,
      })
    })

    const continentBreakdown = Array.from(continentTotals.entries())
      .map(([continent, { found, total, cityCount }]) => ({
        continent,
        percent: total > 0 ? found / total : 0,
        found,
        total,
        cityCount,
      }))
      .sort((a, b) => a.continent.localeCompare(b.continent))

    const miniContinentBreakdown = Array.from(miniContinentTotals.entries())
      .map(([continent, { found, total, cityCount }]) => ({
        continent,
        percent: total > 0 ? found / total : 0,
        found,
        total,
        cityCount,
      }))
      .sort((a, b) => a.continent.localeCompare(b.continent))

    setGlobalStats({
      totalStationsFound: totalFound,
      totalStations,
      percentFound: totalStations > 0 ? totalFound / totalStations : 0,
      cityBreakdown: breakdown.sort((a, b) => a.name.localeCompare(b.name)),
      completedCities,
      partialCities,
      notStartedCities,
      continentBreakdown,
      miniTotalStationsFound: miniTotalFound,
      miniTotalStations,
      miniPercentFound: miniTotalStations > 0 ? miniTotalFound / miniTotalStations : 0,
      miniCityBreakdown: miniBreakdown.sort((a, b) => a.name.localeCompare(b.name)),
      miniCompletedCities,
      miniPartialCities,
      miniNotStartedCities,
      miniContinentBreakdown,
    })
    setCityProgress(next)
  }, [enrichedCities, progressSummaries])

  useEffect(() => {
    computeCityProgress()
  }, [computeCityProgress])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const handleProgressUpdate = () => {
      computeCityProgress()
    }
    window.addEventListener('storage', handleProgressUpdate)
    window.addEventListener('focus', handleProgressUpdate)
    return () => {
      window.removeEventListener('storage', handleProgressUpdate)
      window.removeEventListener('focus', handleProgressUpdate)
    }
  }, [computeCityProgress])

  const cityMatchesSearch = useCallback(
    (entry: (typeof globalStats)['cityBreakdown'][number]) => {
      const query = globalStatsSearch.trim().toLowerCase()
      if (!query) return true
      const cityMeta = cityMetaBySlug.get(entry.slug)
      const keywords = cityMeta?.keywords?.join(' ') ?? ''
      const haystack = `${entry.name} ${entry.slug} ${cityMeta?.continent ?? ''} ${keywords}`.toLowerCase()
      return haystack.includes(query)
    },
    [cityMetaBySlug, globalStatsSearch],
  )

  const miniCityMatchesSearch = useCallback(
    (entry: (typeof globalStats)['miniCityBreakdown'][number]) => {
      const query = globalStatsSearch.trim().toLowerCase()
      if (!query) return true
      const miniCity = miniCityMetaBySlug.get(entry.slug)
      const localizedName = formatLocalizedCityName(entry.name, entry.slug, settings.language)
      const localizedParentName = formatLocalizedCityName(
        entry.parentName,
        entry.parentSlug,
        settings.language,
      )
      const haystack = [
        entry.name,
        localizedName,
        entry.slug,
        entry.parentName,
        localizedParentName,
        miniCity?.continent ?? '',
        ...(miniCity?.keywords ?? []),
      ]
          .join(' ')
          .toLowerCase()
      return haystack.includes(query)
    },
    [globalStatsSearch, miniCityMetaBySlug, settings.language],
  )

  const isValidCityViewMode = useCallback(
    (value: string | undefined | null): value is CityCardVariant =>
      !!value && CITY_VIEW_OPTIONS.some((option) => option.value === value),
    [],
  )

  const isValidTab = useCallback(
    (value: string | undefined | null): value is TabOption =>
      !!value && TAB_OPTIONS.some((option) => option.id === value),
    [],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const enabled =
      searchParams?.get('debugTabs') === '1' ||
      window.localStorage.getItem(TAB_DEBUG_STORAGE_KEY) === '1'
    const wasEnabled = tabDebugEnabledRef.current
    tabDebugEnabledRef.current = enabled
    if (enabled && !wasEnabled) {
      console.debug('[MetroMemory tabs] debug enabled', {
        href: window.location.href,
        activeTab,
        savedPreference: uiPreferences.homeActiveTab ?? null,
      })
    }
  }, [activeTab, searchParams, uiPreferences.homeActiveTab])

  useEffect(() => {
    let nextOpen: boolean | null = null

    if (typeof uiPreferences.continentNavOpen === 'boolean') {
      nextOpen = uiPreferences.continentNavOpen
    } else if (!navPrefsHydratedRef.current && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(CONTINENT_NAV_OPEN_STORAGE_KEY)
      if (stored === '1' || stored === 'true') {
        nextOpen = true
      } else if (stored === '0' || stored === 'false') {
        nextOpen = false
      }
    }

    if (nextOpen !== null && nextOpen !== continentNavOpen) {
      setContinentNavOpen(nextOpen)
    }

    if (!navPrefsHydratedRef.current) {
      navPrefsHydratedRef.current = true
    }
  }, [continentNavOpen, uiPreferences.continentNavOpen])

  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    logTabDebug('url-tab-effect', {
      tabParam,
      activeTab,
    })
    if (!isValidTab(tabParam)) {
      return
    }

    if (tabParam !== activeTab) {
      logTabDebug('url-tab-effect:setActiveTab', {
        from: activeTab,
        to: tabParam,
      })
      setActiveTab(tabParam)
    }

    if (!tabPrefsHydratedRef.current) {
      tabPrefsHydratedRef.current = true
    }
  }, [activeTab, isValidTab, logTabDebug, searchParams])

  useEffect(() => {
    if (tabPrefsHydratedRef.current) {
      return
    }

    let nextTab: TabOption | null = null

    if (isValidTab(uiPreferences.homeActiveTab)) {
      nextTab = uiPreferences.homeActiveTab
    } else if (typeof window !== 'undefined') {
      const storedTab = window.localStorage.getItem(HOME_ACTIVE_TAB_STORAGE_KEY)
      if (isValidTab(storedTab)) {
        nextTab = storedTab
      }
    }

    if (nextTab && nextTab !== activeTab) {
      logTabDebug('fallback-tab-hydration:setActiveTab', {
        from: activeTab,
        to: nextTab,
        savedPreference: uiPreferences.homeActiveTab ?? null,
      })
      setActiveTab(nextTab)
    }

    tabPrefsHydratedRef.current = true
  }, [activeTab, isValidTab, logTabDebug, uiPreferences.homeActiveTab])

  useEffect(() => {
    let nextProvider: HomeMapProvider = requestInMainlandChina ? 'amap' : 'mapbox'

    if (canToggleHomeMapProvider && typeof window !== 'undefined') {
      const storedProvider = window.localStorage.getItem(HOME_MAP_PROVIDER_STORAGE_KEY)
      if (isValidHomeMapProvider(storedProvider)) {
        nextProvider = storedProvider
      }
    }

    setMapProvider((prev) => (prev === nextProvider ? prev : nextProvider))

    if (!mapProviderHydratedRef.current) {
      mapProviderHydratedRef.current = true
    }
  }, [canToggleHomeMapProvider, requestInMainlandChina])

  useEffect(() => {
    if (!mapProviderHydratedRef.current || typeof window === 'undefined') return
    window.localStorage.setItem(HOME_MAP_PROVIDER_STORAGE_KEY, mapProvider)
  }, [mapProvider])

  useEffect(() => {
    let nextMode: CityCardVariant | null = null
    let nextSatellite: boolean | null = null

    if (isValidCityViewMode(uiPreferences.cityViewMode)) {
      nextMode = uiPreferences.cityViewMode
    } else if (!viewPrefsHydratedRef.current && typeof window !== 'undefined') {
      const storedMode = window.localStorage.getItem(CITY_VIEW_MODE_STORAGE_KEY)
      if (isValidCityViewMode(storedMode)) {
        nextMode = storedMode
      }
    }

    if (typeof uiPreferences.cityViewSatellite === 'boolean') {
      nextSatellite = uiPreferences.cityViewSatellite
    } else if (!viewPrefsHydratedRef.current && typeof window !== 'undefined') {
      const storedSatellite = window.localStorage.getItem(
        CITY_VIEW_SATELLITE_STORAGE_KEY,
      )
      if (storedSatellite === '1' || storedSatellite === 'true') {
        nextSatellite = true
      } else if (storedSatellite === '0' || storedSatellite === 'false') {
        nextSatellite = false
      }
    }

    if (nextMode && nextMode !== cityViewMode) {
      setCityViewMode(nextMode)
    }
    if (nextSatellite !== null && nextSatellite !== isSatellite) {
      setIsSatellite(nextSatellite)
    }

    if (!viewPrefsHydratedRef.current) {
      viewPrefsHydratedRef.current = true
    }
  }, [
    cityViewMode,
    isSatellite,
    isValidCityViewMode,
    uiPreferences.cityViewMode,
    uiPreferences.cityViewSatellite,
  ])

  useEffect(() => {
    if (!viewPrefsHydratedRef.current) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CITY_VIEW_MODE_STORAGE_KEY, cityViewMode)
    }
    updateUiPreferences({ cityViewMode })
  }, [cityViewMode, updateUiPreferences])

  useEffect(() => {
    if (!navPrefsHydratedRef.current) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        CONTINENT_NAV_OPEN_STORAGE_KEY,
        continentNavOpen ? '1' : '0',
      )
    }
    updateUiPreferences({ continentNavOpen })
  }, [continentNavOpen, updateUiPreferences])

  useEffect(() => {
    if (!tabPrefsHydratedRef.current) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(HOME_ACTIVE_TAB_STORAGE_KEY, activeTab)
    }
    logTabDebug('persist-active-tab', {
      activeTab,
    })
    if (isPersistedHomeTab(activeTab)) {
      updateUiPreferences({ homeActiveTab: activeTab })
    }
  }, [activeTab, logTabDebug, updateUiPreferences])

  // Restore scroll position per tab (account > localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedFromAccount = isPersistedHomeTab(activeTab)
      ? uiPreferences.homeScrollPositions?.[activeTab]
      : undefined
    let target = typeof storedFromAccount === 'number' ? storedFromAccount : null
    if (target === null) {
      const raw = window.localStorage.getItem(`${HOME_SCROLL_STORAGE_PREFIX}${activeTab}`)
      const parsed = raw ? parseFloat(raw) : NaN
      if (Number.isFinite(parsed)) {
        target = parsed
      }
    }
    if (target !== null) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: target!, behavior: 'auto' })
      })
    }
  }, [activeTab, uiPreferences.homeScrollPositions])

  // Persist scroll position per tab (localStorage + account)
  useEffect(() => {
    if (typeof window === 'undefined') return
    let rafId: number | null = null
    let timeoutId: number | null = null
    let latestY = 0
    const handleScroll = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      rafId = window.requestAnimationFrame(() => {
        latestY = Math.max(0, window.scrollY)
        window.localStorage.setItem(`${HOME_SCROLL_STORAGE_PREFIX}${activeTab}`, latestY.toString())
        if (timeoutId === null) {
          timeoutId = window.setTimeout(() => {
            if (isPersistedHomeTab(activeTab)) {
              updateUiPreferences({ homeScrollPositions: { [activeTab]: latestY } })
            }
            timeoutId = null
          }, 800)
        }
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
       if (timeoutId !== null) window.clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [activeTab, updateUiPreferences])

  useEffect(() => {
    if (cityViewMode !== 'globe' && cityViewMode !== 'map') {
      setContinentFocus(null)
    }
  }, [cityViewMode])

  useEffect(() => {
    if (!viewPrefsHydratedRef.current) return
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        CITY_VIEW_SATELLITE_STORAGE_KEY,
        isSatellite ? '1' : '0',
      )
    }
    updateUiPreferences({ cityViewSatellite: isSatellite })
  }, [isSatellite, updateUiPreferences])

  const visibleCityBreakdown = useMemo(() => {
    const filtered = globalStats.cityBreakdown.filter(cityMatchesSearch)
    const compareName = (a: GlobalStats['cityBreakdown'][number], b: GlobalStats['cityBreakdown'][number]) =>
      a.name.localeCompare(b.name)
    const continentOf = (entry: GlobalStats['cityBreakdown'][number]) =>
      cityMetaBySlug.get(entry.slug)?.continent ?? ''
    const compareContinent = (
      a: GlobalStats['cityBreakdown'][number],
      b: GlobalStats['cityBreakdown'][number],
    ) => {
      const result = continentOf(a).localeCompare(continentOf(b))
      return result !== 0 ? result : compareName(a, b)
    }
    const getProgress = (entry: GlobalStats['cityBreakdown'][number]) => clamp01(entry.percent)
    const base = [...filtered]
    switch (globalStatsSort) {
      case 'name-asc':
        return base.sort(compareName)
      case 'name-desc':
        return base.sort((a, b) => compareName(b, a))
      case 'continent-asc':
        return base.sort(compareContinent)
      case 'continent-desc':
        return base.sort((a, b) => compareContinent(b, a))
      case 'progress-not-played':
        return base.sort((a, b) => {
          const diff = getProgress(a) - getProgress(b)
          if (Math.abs(diff) > 0.0001) {
            return diff
          }
          return compareName(a, b)
        })
      case 'progress-played':
        return base.sort((a, b) => {
          const diff = getProgress(b) - getProgress(a)
          if (Math.abs(diff) > 0.0001) {
            return diff
          }
          return compareName(a, b)
        })
      case 'default':
      default:
        return base.sort(compareName)
    }
  }, [cityMetaBySlug, globalStats.cityBreakdown, globalStatsSort, cityMatchesSearch])

  const visibleMiniCityBreakdown = useMemo(() => {
    const filtered = globalStats.miniCityBreakdown.filter(miniCityMatchesSearch)
    const compareName = (
      a: GlobalStats['miniCityBreakdown'][number],
      b: GlobalStats['miniCityBreakdown'][number],
    ) => a.name.localeCompare(b.name)
    const continentOf = (entry: GlobalStats['miniCityBreakdown'][number]) =>
      miniCityMetaBySlug.get(entry.slug)?.continent ?? ''
    const compareContinent = (
      a: GlobalStats['miniCityBreakdown'][number],
      b: GlobalStats['miniCityBreakdown'][number],
    ) => {
      const result = continentOf(a).localeCompare(continentOf(b))
      return result !== 0 ? result : compareName(a, b)
    }
    const getProgress = (entry: GlobalStats['miniCityBreakdown'][number]) => clamp01(entry.percent)
    const base = [...filtered]
    switch (globalStatsSort) {
      case 'name-asc':
        return base.sort(compareName)
      case 'name-desc':
        return base.sort((a, b) => compareName(b, a))
      case 'continent-asc':
        return base.sort(compareContinent)
      case 'continent-desc':
        return base.sort((a, b) => compareContinent(b, a))
      case 'progress-not-played':
        return base.sort((a, b) => {
          const diff = getProgress(a) - getProgress(b)
          if (Math.abs(diff) > 0.0001) {
            return diff
          }
          return compareName(a, b)
        })
      case 'progress-played':
        return base.sort((a, b) => {
          const diff = getProgress(b) - getProgress(a)
          if (Math.abs(diff) > 0.0001) {
            return diff
          }
          return compareName(a, b)
        })
      case 'default':
      default:
        return base.sort(compareName)
    }
  }, [globalStats.miniCityBreakdown, globalStatsSort, miniCityMatchesSearch, miniCityMetaBySlug])

  const statsNavigation = useMemo(() => {
    if (!visibleCityBreakdown.length) {
      return null
    }
    const slugs = visibleCityBreakdown.map(({ slug }) => slug)
    const slugToName = new Map(visibleCityBreakdown.map(({ slug, name }) => [slug, name]))
    const slugToPath = new Map<string, string>()
    visibleCityBreakdown.forEach(({ slug }) => {
      const city = cityMetaBySlug.get(slug)
      const cityPath = city ? getPathFromLink(city.link) : null
      if (cityPath) {
        slugToPath.set(slug, cityPath)
      }
    })
    return { slugs, slugToName, slugToPath }
  }, [visibleCityBreakdown, cityMetaBySlug])

  const statsCityDisplayName =
    (statsSlug && statsNavigation?.slugToName.get(statsSlug)) ??
    (statsSlug ? miniCityMetaBySlug.get(statsSlug)?.name : null) ??
    statsSlug ??
    ''
  const statsSlugIsMiniCity = statsSlug ? miniCityMetaBySlug.has(statsSlug) : false

  const handleNavigateStats = (direction: -1 | 1) => {
    if (!statsNavigation || !statsSlug) {
      return
    }
    const { slugs } = statsNavigation
    if (slugs.length <= 1) {
      return
    }
    const currentIndex = slugs.indexOf(statsSlug)
    if (currentIndex === -1) {
      return
    }
    const nextIndex = (currentIndex + direction + slugs.length) % slugs.length
    const nextSlug = slugs[nextIndex]
    setStatsSlug(nextSlug)
    setStatsPath(statsNavigation.slugToPath.get(nextSlug) ?? null)
  }

  const handlePrevStats = () => handleNavigateStats(-1)
  const handleNextStats = () => handleNavigateStats(1)

  const sortedCities = useMemo(() => {
    const compareName = (a: ICity, b: ICity) => a.name.localeCompare(b.name)
    const compareContinent = (a: ICity, b: ICity) => {
      const result = a.continent.localeCompare(b.continent)
      return result !== 0 ? result : compareName(a, b)
    }
    const getProgress = (city: ICity) => {
      const slug = getSlugFromLink(city.link)
      if (!slug) {
        return 0
      }
      const value = cityProgress[slug]
      return Number.isFinite(value) ? value : 0
    }
    const baseline = [...enrichedCities]
    switch (citySort) {
      case 'name-asc':
        return baseline.sort(compareName)
      case 'name-desc':
        return baseline.sort((a, b) => compareName(b, a))
      case 'continent-asc':
        return baseline.sort(compareContinent)
      case 'continent-desc':
        return baseline.sort((a, b) => compareContinent(b, a))
      case 'progress-not-played':
        return baseline.sort((a, b) => {
          const diff = getProgress(a) - getProgress(b)
          if (Math.abs(diff) > 0.0001) {
            return diff
          }
          return compareName(a, b)
        })
      case 'progress-played':
        return baseline.sort((a, b) => {
          const diff = getProgress(b) - getProgress(a)
          if (Math.abs(diff) > 0.0001) {
            return diff
          }
          return compareName(a, b)
        })
      case 'default':
      default:
        return baseline.sort(compareName)
    }
  }, [enrichedCities, cityProgress, citySort])

  const groupedCities = useMemo(() => {
    const continentMap = new Map<string, ICity[]>()
    sortedCities.forEach((city) => {
      if (!continentMap.has(city.continent)) {
        continentMap.set(city.continent, [])
      }
      continentMap.get(city.continent)!.push(city)
    })
    const entries = Array.from(continentMap.entries())
    const sortEntries = () => {
      if (citySort === 'continent-asc') return entries.sort((a, b) => a[0].localeCompare(b[0]))
      if (citySort === 'continent-desc') return entries.sort((a, b) => b[0].localeCompare(a[0]))
      return entries.sort((a, b) => {
        const aIndex = CONTINENT_ORDER.indexOf(a[0])
        const bIndex = CONTINENT_ORDER.indexOf(b[0])
        if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    }
    return sortEntries().map(([continent, list]) => ({ continent, cities: list }))
  }, [sortedCities, citySort])

  const fullCitiesSet = useMemo(() => new Set(enrichedCities.map((city) => city.link)), [enrichedCities])

  const results = useMemo(() => {
    const normalized = search.trim()
    if (normalized.length === 0) {
      return fullCitiesSet
    }
    const res = fuse.search(normalized)
    return new Set(res.map((result) => result.item.link))
  }, [search, fuse, fullCitiesSet])

  const visibleGroups = useMemo(() => {
    return groupedCities
      .map(({ continent, cities }) => ({
        continent,
        cities: cities.filter((city) => results.has(city.link)),
      }))
      .filter((group) => group.cities.length > 0)
  }, [groupedCities, results])
  const expandCityListWithMiniCities = useCallback(
    (cityList: ICity[]) =>
      cityList.flatMap((city) => {
        const slug = getSlugFromLink(city.link)
        if (!slug || isMiniCitySlug(slug)) {
          return [city]
        }

        const miniCities = miniCitiesByParentSlug.get(slug) ?? []
        if (miniCities.length === 0) {
          return [city]
        }

        return [
          city,
          ...miniCities.map(
              (miniCity) =>
                ({
                name: formatLocalizedCityName(
                  miniCity.name,
                  miniCity.slug,
                  settings.language,
                ),
                  image: getCityOpenGraphImagePath(miniCity.slug),
                  link: miniCity.link,
                  continent: city.continent,
                disabled: false,
                hideInStats: false,
                keywords: [],
              }) as ICity,
          ),
        ]
      }),
    [miniCitiesByParentSlug, settings.language],
  )
  const displayGroups = useMemo(
    () =>
      visibleGroups.map((group) => ({
        ...group,
        cities: expandCityListWithMiniCities(group.cities),
      })),
    [expandCityListWithMiniCities, visibleGroups],
  )

  const navigationCities = useMemo(
    () => displayGroups.flatMap((group) => group.cities),
    [displayGroups],
  )

  const favoriteCities = useMemo(
    () =>
      navigationCities.filter((city) => {
        const slug = getSlugFromLink(city.link)
        return slug ? favoriteSlugs.has(slug) : false
      }),
    [navigationCities, favoriteSlugs],
  )

  const groupsWithFavorites = useMemo(
    () => {
      if (showFavoritesOnly) {
        return favoriteCities.length > 0
          ? [{ continent: 'Favorites', cities: favoriteCities }]
          : []
      }
      return favoriteCities.length > 0
        ? [{ continent: 'Favorites', cities: favoriteCities }, ...displayGroups]
        : displayGroups
    },
    [displayGroups, favoriteCities, showFavoritesOnly],
  )

  const unlockedSet = useMemo(() => new Set(unlockedData.keys()), [unlockedData])
  const allAchievementSlugs = useMemo(
    () => combinedAchievementCatalog.map((entry) => entry.slug),
    [combinedAchievementCatalog],
  )
  const cityStatsMap = useMemo(
    () => new Map(globalStats.cityBreakdown.map((entry) => [entry.slug, entry])),
    [globalStats.cityBreakdown],
  )
  const miniCityStatsMap = useMemo(
    () => new Map(globalStats.miniCityBreakdown.map((entry) => [entry.slug, entry])),
    [globalStats.miniCityBreakdown],
  )
  const cityNavItems = useMemo(() => {
    const cityStatsBySlug = new Map(
      globalStats.cityBreakdown.map(({ slug, found, total }) => [slug, { found, total }]),
    )
    miniCityStatsMap.forEach(({ slug, found, total }) => {
      cityStatsBySlug.set(slug, { found, total })
    })

    return groupsWithFavorites.map((group) => {
      const totalProgress = group.cities.reduce((acc, city) => {
        const slug = getSlugFromLink(city.link)
        const progress = slug ? cityProgress[slug] ?? 0 : 0
        return acc + progress
      }, 0)
      const averagePercent =
        group.cities.length > 0 ? Math.max(0, Math.min(1, totalProgress / group.cities.length)) : 0

      const countryMap = new Map<
        string,
        { found: number; total: number; cityCount: number; miniCityCount: number }
      >()
      group.cities.forEach((city) => {
        const country = getCountryFromLink(city.link) ?? 'unknown'
        const slug = getSlugFromLink(city.link)
        const stats = slug ? cityStatsBySlug.get(slug) : null
        const found = stats ? Math.min(stats.found, stats.total) : 0
        const total = stats ? stats.total : 0
        const existing = countryMap.get(country) ?? {
          found: 0,
          total: 0,
          cityCount: 0,
          miniCityCount: 0,
        }
        const isMiniCity = isMiniCitySlug(slug)
        countryMap.set(country, {
          found: existing.found + found,
          total: existing.total + total,
          cityCount: existing.cityCount + (isMiniCity ? 0 : 1),
          miniCityCount: existing.miniCityCount + (isMiniCity ? 1 : 0),
        })
      })

      const countries = Array.from(countryMap.entries())
        .map(([country, stats]) => {
          const percent = stats.total > 0 ? stats.found / stats.total : 0
          return {
            country,
            label: formatCountryLabel(country, settings.language),
            cityCount: stats.cityCount,
            miniCityCount: stats.miniCityCount,
            percent,
            sectionId: getCountrySectionId(group.continent, country),
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label))

      const { cityCount, miniCityCount } = getDisplayedCityCounts(group.cities)

      return {
        continent: group.continent,
        cityCount,
        miniCityCount,
        sectionId: getContinentSectionId(group.continent),
        averagePercent,
        countries,
      }
    })
  }, [groupsWithFavorites, cityProgress, globalStats.cityBreakdown, miniCityStatsMap])

  const achievementSearchSet = useMemo(() => {
    const normalized = achievementSearch.trim()
    if (normalized.length === 0) {
      return new Set(allAchievementSlugs)
    }
    const res = achievementFuse.search(normalized)
    return new Set(res.map((result) => result.item.slug))
  }, [achievementSearch, achievementFuse, allAchievementSlugs])

  const visibleAchievements = useMemo(() => {
    const filtered = achievementCatalog.filter((entry) => achievementSearchSet.has(entry.slug))
    return sortAchievementEntries(filtered, achievementSort, unlockedSet)
  }, [achievementCatalog, achievementSearchSet, achievementSort, unlockedSet])

  const visibleMiniAchievements = useMemo(() => {
    const filtered = miniCityAchievementCatalog.filter((entry) =>
      achievementSearchSet.has(entry.slug),
    )
    return sortAchievementEntries(filtered, achievementSort, unlockedSet)
  }, [achievementSearchSet, achievementSort, miniCityAchievementCatalog, unlockedSet])

  const achievementGroups = useMemo<AchievementContinentGroup[]>(() => {
    const continentMap = new Map<string, AchievementMeta[]>()
    visibleAchievements.forEach((entry) => {
      const continent = entry.continent || 'Unknown'
      if (!continentMap.has(continent)) {
        continentMap.set(continent, [])
      }
      continentMap.get(continent)!.push(entry)
    })

    const entries = Array.from(continentMap.entries())
    const sortedContinents =
      achievementSort === 'continent-asc'
        ? entries.sort((a, b) => a[0].localeCompare(b[0]))
        : achievementSort === 'continent-desc'
          ? entries.sort((a, b) => b[0].localeCompare(a[0]))
          : entries.sort((a, b) => {
              if (a[0] === 'Global') return -1
              if (b[0] === 'Global') return 1
              const aIndex = CONTINENT_ORDER.indexOf(a[0])
              const bIndex = CONTINENT_ORDER.indexOf(b[0])
              if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
              if (aIndex === -1) return 1
              if (bIndex === -1) return -1
              return aIndex - bIndex
            })

    return sortedContinents.map(([continent, list]) => {
      const countryMap = new Map<string, AchievementMeta[]>()
      list.forEach((entry) => {
        const country = entry.country || 'unknown'
        const existing = countryMap.get(country)
        if (existing) {
          existing.push(entry)
        } else {
          countryMap.set(country, [entry])
        }
      })
      const countries = Array.from(countryMap.entries())
        .map(([country, entries]) => ({
          country,
          entries,
        }))
        .sort((a, b) =>
          formatCountryLabel(a.country, settings.language).localeCompare(
            formatCountryLabel(b.country, settings.language),
          ),
        )
      return {
        continent,
        countries,
      }
    })
  }, [achievementSort, visibleAchievements])

  const miniAchievementGroups = useMemo<AchievementContinentGroup[]>(() => {
    const continentMap = new Map<string, AchievementMeta[]>()
    visibleMiniAchievements.forEach((entry) => {
      const continent = entry.continent || 'Unknown'
      if (!continentMap.has(continent)) {
        continentMap.set(continent, [])
      }
      continentMap.get(continent)!.push(entry)
    })

    const entries = Array.from(continentMap.entries())
    const sortedContinents =
      achievementSort === 'continent-asc'
        ? entries.sort((a, b) => a[0].localeCompare(b[0]))
        : achievementSort === 'continent-desc'
          ? entries.sort((a, b) => b[0].localeCompare(a[0]))
          : entries.sort((a, b) => {
              const aIndex = CONTINENT_ORDER.indexOf(a[0])
              const bIndex = CONTINENT_ORDER.indexOf(b[0])
              if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
              if (aIndex === -1) return 1
              if (bIndex === -1) return -1
              return aIndex - bIndex
            })

    return sortedContinents.map(([continent, list]) => {
      const countryMap = new Map<string, AchievementMeta[]>()
      list.forEach((entry) => {
        const country = entry.country || 'unknown'
        const existing = countryMap.get(country)
        if (existing) {
          existing.push(entry)
        } else {
          countryMap.set(country, [entry])
        }
      })
      const countries = Array.from(countryMap.entries())
        .map(([country, entries]) => ({
          country,
          entries,
        }))
        .sort((a, b) =>
          formatCountryLabel(a.country, settings.language).localeCompare(
            formatCountryLabel(b.country, settings.language),
          ),
        )
      return {
        continent,
        countries,
      }
    })
  }, [achievementSort, visibleMiniAchievements])

  const achievementNavItems = useMemo(() => {
    return achievementGroups.map((group) => {
      const total = group.countries.reduce((sum, country) => sum + country.entries.length, 0)
      const unlocked = group.countries.reduce(
        (sum, country) =>
          sum + country.entries.filter((entry) => unlockedSet.has(entry.slug)).length,
        0,
      )
      const averagePercent = total > 0 ? unlocked / total : 0

      const countries = group.countries.map((country) => {
        const countryTotal = country.entries.length
        const countryUnlocked = country.entries.filter((entry) =>
          unlockedSet.has(entry.slug),
        ).length
        const percent = countryTotal > 0 ? countryUnlocked / countryTotal : 0
        return {
          country: country.country,
          label: formatCountryLabel(country.country, settings.language),
          cityCount: countryTotal,
          miniCityCount: 0,
          percent,
          sectionId: getCountrySectionId(group.continent, country.country),
        }
      })

      return {
        continent: group.continent,
        cityCount: total,
        miniCityCount: 0,
        sectionId: getContinentSectionId(group.continent),
        averagePercent,
        countries,
      }
    })
  }, [achievementGroups, unlockedSet])

  const fetchUpdateLog = useCallback(
    async (signal?: AbortSignal) => {
      setUpdateLogState((prev) => ({
        ...prev,
        status: 'loading',
        errorMessage: undefined,
      }))

      const requestController = new AbortController()
      let didTimeout = false
      const timeoutId = setTimeout(() => {
        didTimeout = true
        requestController.abort()
      }, UPDATE_LOG_TIMEOUT_MS)
      const handleOuterAbort = () => {
        requestController.abort()
      }
      if (signal) {
        if (signal.aborted) {
          requestController.abort()
        } else {
          signal.addEventListener('abort', handleOuterAbort, { once: true })
        }
      }

      try {
        const response = await fetch(UPDATE_LOG_ENDPOINT, {
          headers: UPDATE_LOG_HEADERS,
          signal: requestController.signal,
        })

        if (!response.ok) {
          throw new Error(`GitHub responded with status ${response.status}`)
        }

        const payload = (await response.json()) as GithubCommitResponse[]
        if (signal?.aborted) {
          return
        }

        if (!Array.isArray(payload)) {
          throw new Error('Unexpected GitHub response')
        }

        const entries = payload
          .map<UpdateLogEntry | null>((item) => {
            const sha = item.sha ?? ''
            if (!sha) {
              return null
            }
            const message = formatCommitMessage(item.commit?.message)
            const author =
              item.commit?.author?.name ??
              item.author?.login ??
              'Unknown contributor'
            const date =
              item.commit?.author?.date ??
              item.commit?.committer?.date ??
              undefined
            const url =
              item.html_url ??
              `https://github.com/kirklandwaterbot/metro-memory/commit/${sha}`

            return {
              sha,
              message,
              author,
              date: typeof date === 'string' ? date : undefined,
              url,
            }
          })
          .filter((entry): entry is UpdateLogEntry => entry !== null)
          .slice(0, UPDATE_LOG_LIMIT)

        setUpdateLogState({
          status: 'success',
          entries,
          lastUpdated: new Date().toISOString(),
        })
      } catch (error) {
        const abortedByOuterSignal = Boolean(signal?.aborted) && !didTimeout
        if (abortedByOuterSignal) {
          return
        }

        const isAbortError = error instanceof Error && error.name === 'AbortError'
        if (didTimeout || isAbortError) {
          setUpdateLogState({
            status: 'success',
            entries: [],
            lastUpdated: new Date().toISOString(),
          })
          return
        }

        setUpdateLogState({
          status: 'error',
          entries: [],
          errorMessage:
            error instanceof Error ? error.message : 'Unable to fetch updates',
        })
      } finally {
        clearTimeout(timeoutId)
        if (signal) {
          signal.removeEventListener('abort', handleOuterAbort)
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (activeTab !== 'updateLog' || updateLogState.status !== 'idle') {
      return
    }
    void fetchUpdateLog()
  }, [activeTab, fetchUpdateLog])

  useEffect(() => {
    const computeAchievements = () => {
      if (typeof window === 'undefined') return
      const curUnlocked = new Map<string, number>()
      const readStringArray = (key: string) => {
        try {
          const raw = window.localStorage.getItem(key)
          const parsed = raw ? JSON.parse(raw) : []
          return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []
        } catch {
          return []
        }
      }

      // city completion achievements (existing behavior)
      cityAchievementCatalog.forEach((entry) => {
        const { slug } = entry
        const totalRaw = window.localStorage.getItem(`${slug}-station-total`)
        const total = Number(totalRaw)
        if (!Number.isFinite(total) || total <= 0) {
          return
        }
        let foundCount = 0
        const stored = window.localStorage.getItem(`${slug}-stations`)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) {
              foundCount = new Set(parsed.filter((value) => typeof value === 'number')).size
            } else if (typeof parsed === 'number') {
              foundCount = parsed
            }
          } catch {
            foundCount = 0
          }
        }
        if (foundCount >= total) {
          // Calculate timestamp
          let maxTime = 0
          const timestampsRaw = window.localStorage.getItem(`${slug}-stations-found-at`)
          if (timestampsRaw) {
             try {
                const timestamps = JSON.parse(timestampsRaw)
                Object.values(timestamps).forEach((ts) => {
                    if (typeof ts === 'string') {
                        const t = Date.parse(ts)
                        if (t > maxTime) maxTime = t
                    }
                })
             } catch {}
           }
           // Fallback to now if 0? Or just 0.
           curUnlocked.set(slug, maxTime)
        }
      })
      miniCityAchievementCatalog.forEach((entry) => {
        const { slug } = entry
        const totalRaw = window.localStorage.getItem(`${slug}-station-total`)
        const total = Number(totalRaw)
        if (!Number.isFinite(total) || total <= 0) {
          return
        }
        let foundCount = 0
        const stored = window.localStorage.getItem(`${slug}-stations`)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) {
              foundCount = new Set(parsed.filter((value) => typeof value === 'number')).size
            } else if (typeof parsed === 'number') {
              foundCount = parsed
            }
          } catch {
            foundCount = 0
          }
        }
        if (foundCount >= total) {
          let maxTime = 0
          const timestampsRaw = window.localStorage.getItem(`${slug}-stations-found-at`)
          if (timestampsRaw) {
            try {
              const timestamps = JSON.parse(timestampsRaw)
              Object.values(timestamps).forEach((ts) => {
                if (typeof ts === 'string') {
                  const t = Date.parse(ts)
                  if (t > maxTime) maxTime = t
                }
              })
            } catch {
              // ignore
            }
          }
          curUnlocked.set(slug, maxTime)
        }
      })
      const unlockedMainCityCount = cityAchievementCatalog.filter((entry) =>
        curUnlocked.has(entry.slug),
      ).length
      if (
        cityAchievementCatalog.length > 0 &&
        unlockedMainCityCount === cityAchievementCatalog.length
      ) {
        // Master achievement gets latest time of all cities
        const times = Array.from(curUnlocked.values())
        const maxTime = times.length > 0 ? Math.max(...times) : 0
           curUnlocked.set(masterAchievement.slug, maxTime)
      }

      // global achievements stored in mm-achievements-earned
      try {
        const raw = window.localStorage.getItem('mm-achievements-earned')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            const now = Date.now()
            parsed.forEach((slug: unknown) => {
              if (typeof slug === 'string') {
                curUnlocked.set(slug, now)
              }
            })
          }
        }
      } catch {
        // ignore parse errors
      }

      setUnlockedData(curUnlocked)

      const playDays = readStringArray('mm-play-days').length
      const playMonths = readStringArray('mm-play-months').length
      const lineMasterKeys = readStringArray('mm-line-master-keys').length
      const favoritesCompleted = readStringArray('mm-favorites-completed').length

      let uniqueCities = 0
      let uniqueContinents = 0
      try {
        const raw = window.localStorage.getItem('mm-completions')
        const parsed = raw ? JSON.parse(raw) : []
        if (Array.isArray(parsed)) {
          const citySet = new Set<string>()
          const continentSet = new Set<string>()
          parsed.forEach((entry) => {
            if (entry && typeof entry.city === 'string') {
              citySet.add(entry.city)
            }
            if (entry && typeof entry.continent === 'string') {
              continentSet.add(entry.continent)
            }
          })
          uniqueCities = citySet.size
          uniqueContinents = continentSet.size
        }
      } catch {
        uniqueCities = 0
        uniqueContinents = 0
      }

      const globalStations = Number(window.localStorage.getItem('mm-global-unique-stations') || '0')
      const mapNamesToggles = Number(window.localStorage.getItem('mm-map-names-toggles') || '0')

      setAchievementMetrics({
        playDays,
        playMonths,
        globalStations,
        lineMasterKeys,
        mapNamesToggles,
        favoritesCompleted,
        uniqueCities,
        uniqueContinents,
      })
    }

    computeAchievements()
    window.addEventListener('storage', computeAchievements)
    window.addEventListener('focus', computeAchievements)
    return () => {
      window.removeEventListener('storage', computeAchievements)
      window.removeEventListener('focus', computeAchievements)
    }
  }, [cityAchievementCatalog, masterAchievement.slug, miniCityAchievementCatalog])

  const achievementProgress = useMemo(() => {
    const progressMap = new Map<string, AchievementProgressData>()

    cityAchievementCatalog.forEach((entry) => {
      const stats = cityStatsMap.get(entry.slug)
      if (!stats || stats.total <= 0) return
      progressMap.set(entry.slug, { current: stats.found, target: stats.total })
    })
    miniCityAchievementCatalog.forEach((entry) => {
      const stats = globalStats.miniCityBreakdown.find((mini) => mini.slug === entry.slug)
      if (!stats || stats.total <= 0) return
      progressMap.set(entry.slug, { current: stats.found, target: stats.total })
    })

    if (cityAchievementCatalog.length > 0) {
      progressMap.set(masterAchievement.slug, {
        current: globalStats.completedCities,
        target: cityAchievementCatalog.length,
      })
    }

    const addThreshold = (slug: string, current: number, target: number) => {
      if (target <= 0 || !Number.isFinite(current)) return
      progressMap.set(slug, { current, target })
    }

    addThreshold('monthly-commuter', achievementMetrics.playMonths, 3)
    addThreshold('station-collector', achievementMetrics.globalStations, 1000)
    addThreshold('marathoner', achievementMetrics.globalStations, 10000)
    addThreshold('line-finisher', achievementMetrics.lineMasterKeys, 5)
    addThreshold('explorer-3', achievementMetrics.uniqueCities, 3)
    addThreshold('explorer-10', achievementMetrics.uniqueCities, 10)
    addThreshold('explorer-25', achievementMetrics.uniqueCities, 25)
    addThreshold('explorer-50', achievementMetrics.uniqueCities, 50)
    addThreshold('all-rounder', achievementMetrics.uniqueContinents, 3)
    addThreshold('globe-trotter', achievementMetrics.uniqueContinents, 6)
    addThreshold('favorites-first', achievementMetrics.favoritesCompleted, 5)

    return progressMap
  }, [
    achievementMetrics,
    cityAchievementCatalog,
    cityStatsMap,
    globalStats.completedCities,
    globalStats.miniCityBreakdown,
    masterAchievement.slug,
    miniCityAchievementCatalog,
  ])

  const hasCityResults = groupsWithFavorites.length > 0
  const hasAchievementResults =
    achievementGroups.length > 0 || miniAchievementGroups.length > 0
  const shouldShowContinentNav =
    (activeTab === 'cities' && hasCityResults) ||
    (activeTab === 'achievements' && hasAchievementResults)
  const activeNavItems = activeTab === 'achievements' ? achievementNavItems : cityNavItems

  useEffect(() => {
    if (!shouldShowContinentNav) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleParams = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            id: e.target.id,
            ratio: e.intersectionRatio,
            y: e.boundingClientRect.y,
          }))

        if (Date.now() < suppressActiveUntilRef.current) {
          return
        }

        if (visibleParams.length > 0) {
          const best = visibleParams
            .sort((a, b) => {
              const distA = Math.abs(a.y)
              const distB = Math.abs(b.y)
              if (Math.abs(distA - distB) > 6) {
                return distA - distB
              }
              if (Math.abs(b.ratio - a.ratio) > 0.05) {
                return b.ratio - a.ratio
              }
              const aIsCountry = a.id.includes('-country-')
              const bIsCountry = b.id.includes('-country-')
              if (aIsCountry && !bIsCountry) return -1
              if (!aIsCountry && bIsCountry) return 1
              return 0
            })[0]

          if (best) {
            setActiveSection(best.id)
          }
        }
      },
      {
        rootMargin: '-10% 0px -50% 0px',
        threshold: [0, 0.1, 0.5, 1.0],
      }
    )

    const sections = document.querySelectorAll('section[id^="continent-"]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [shouldShowContinentNav, activeNavItems, activeTab])

  const ensureSectionExpanded = useCallback((sectionId: string) => {
    if (typeof document === 'undefined') {
      return false
    }
    const contentId = `${sectionId}-content`
    const section = document.getElementById(sectionId)
    const content = document.getElementById(contentId)
    if (!section || !content) {
      return false
    }
    const isCollapsed =
      content.getAttribute('aria-hidden') === 'true' || content.classList.contains('hidden')
    if (!isCollapsed) {
      return false
    }
    const toggleButton = section.querySelector<HTMLButtonElement>(
      `button[aria-controls="${contentId}"]`,
    )
    toggleButton?.click()
    return true
  }, [])

  const handleJumpToContinent = useCallback(
    (sectionId: string, continent?: string) => {
      setActiveSection(sectionId)
      suppressActiveUntilRef.current = Date.now() + 800
      const didExpand = ensureSectionExpanded(sectionId)
      const doScroll = () => {
        const target = document.getElementById(sectionId)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      if (didExpand) {
        window.setTimeout(doScroll, 80)
      } else {
        doScroll()
      }
      if (continent) {
        focusContinentOnMap(continent)
      }
    },
    [ensureSectionExpanded, focusContinentOnMap],
  )

  const handleJumpToCountry = useCallback(
    (sectionId: string, continent: string, country: string) => {
      setActiveSection(sectionId)
      suppressActiveUntilRef.current = Date.now() + 800
      const didExpand =
        ensureSectionExpanded(getContinentSectionId(continent)) ||
        ensureSectionExpanded(sectionId)
      const doScroll = () => {
        const target = document.getElementById(sectionId)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      if (didExpand) {
        window.setTimeout(doScroll, 80)
      } else {
        doScroll()
      }
      focusCountryOnMap(country)
    },
    [ensureSectionExpanded, focusCountryOnMap],
  )

  const awardGlobalAchievement = useCallback((slug: string) => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('mm-achievements-earned')
      const parsed = raw ? JSON.parse(raw) : []
      const entries = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
      const set = new Set(entries)
      if (set.has(slug)) return
      set.add(slug)
      window.localStorage.setItem('mm-achievements-earned', JSON.stringify(Array.from(set)))
    } catch {
      // ignore storage errors
    }
  }, [])

  const toggleContinentCollapse = (continent: string) => {
    setCollapsedContinents((prev) => ({
      ...prev,
      [continent]: !prev[continent],
    }))
  }

  const handleGetLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setFavoriteToast({
        message: 'Location is not available in this browser.',
        ts: Date.now(),
      })
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([longitude, latitude])
        const candidates = enrichedCities
          .filter((city) => !isCityDisabledForPreview(city))
          .map((city) => {
            const slug = getSlugFromLink(city.link)
            if (!slug) return null
            const coords = CITY_COORDINATES[slug]
            if (!coords) return null
            const distanceKm = haversineKm(latitude, longitude, coords[1], coords[0])
            return { slug, distanceKm }
          })
          .filter((entry): entry is { slug: string; distanceKm: number } => Boolean(entry))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 5)
        setRecommendedSlugs(candidates.map((entry) => entry.slug))
        setIsLocating(false)
      },
      () => {
        setFavoriteToast({
          message: 'Unable to fetch your location.',
          ts: Date.now(),
        })
        setUserLocation(null)
        setIsLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [enrichedCities, isCityDisabledForPreview])

  const handlePlayRandomCity = useCallback(() => {
    const eligible = enrichedCities
      .filter((city) => !isCityDisabledForPreview(city))
      .map((city) => {
        const slug = getSlugFromLink(city.link)
        if (!slug) return null
        const progress = cityProgress[slug] ?? 0
        return progress < 1 ? city : null
      })
      .filter((city): city is ICity => Boolean(city))

    if (eligible.length === 0) {
      setFavoriteToast({
        message: 'You already completed every city!',
        ts: Date.now(),
      })
      return
    }

    const pick = eligible[Math.floor(Math.random() * eligible.length)]
    router.push(pick.link)
  }, [cityProgress, enrichedCities, isCityDisabledForPreview, router])

  const openStatsPanelForCity = (slug: string) => {
    const city = cityMetaBySlug.get(slug)
    const miniCity = getMiniCityBySlug(slug)
    const cityPath = city ? getPathFromLink(city.link) : null
    if (!cityPath && !miniCity) {
      return
    }
    setStatsSlug(slug)
    setStatsPath(cityPath)
    setStatsOpen(true)

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('mm-stats-opened')
        const parsed = raw ? JSON.parse(raw) : []
        const entries = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
        const set = new Set(entries)
        set.add(slug)
        window.localStorage.setItem('mm-stats-opened', JSON.stringify(Array.from(set)))
        if (set.size >= 10) {
          awardGlobalAchievement('the-archivist')
        }
      } catch {
        // ignore
      }
    }
  }
  const getStatusClass = (percent: number) =>
    percent >= 1
      ? 'text-emerald-600 dark:text-emerald-400'
      : percent > 0
        ? 'text-amber-500'
        : 'text-red-500'

  const renderCityCollection = (cityList: ICity[]) => {
    const variant =
      cityViewMode === 'cover'
        ? 'cover'
        : cityViewMode === 'compact'
          ? 'compact'
          : cityViewMode === 'list'
            ? 'list'
            : 'comfortable'

    if (cityViewMode === 'list') {
      return (
        <div className="space-y-4">
          {cityList.map((city, index) => {
            const slug = getSlugFromLink(city.link)
            const isFavorite = slug ? favoriteSlugs.has(slug) : false
            const isRecommended = slug ? recommendedSet.has(slug) : false
            const currentFamilySlug = getCityFamilySlug(slug)
            const showRightConnector =
              variant !== 'list' &&
              gridColumnCount > 1 &&
              currentFamilySlug !== null &&
              index % gridColumnCount !== gridColumnCount - 1 &&
              currentFamilySlug ===
                getCityFamilySlug(getSlugFromLink(cityList[index + 1]?.link ?? ''))
            const showBottomConnector =
              variant !== 'list' &&
              gridColumnCount > 1 &&
              currentFamilySlug !== null &&
              currentFamilySlug ===
                getCityFamilySlug(getSlugFromLink(cityList[index + gridColumnCount]?.link ?? ''))
            return (
              <Transition
                key={city.link}
                as="div"
                appear
                enterFrom="opacity-0 translate-y-2"
                enter="transition-all ease-out duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leave="transition-all ease-in duration-200"
                show
              >
                <CityCard
                  city={city}
                  variant={variant}
                  visibleCities={navigationCities.length > 0 ? navigationCities : cityList}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  isRecommended={isRecommended}
                  isMiniCity={isMiniCitySlug(slug)}
                  showRightConnector={showRightConnector}
                  showBottomConnector={showBottomConnector}
                />
              </Transition>
            )
          })}
        </div>
      )
    }

    const gridClasses = classNames(
      'mx-auto grid max-w-full grid-cols-1',
      cityViewMode === 'compact' && 'gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5',
      cityViewMode === 'comfortable' && 'gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      cityViewMode === 'cover' && 'gap-6 md:grid-cols-2 xl:grid-cols-3',
    )

    return (
      <div className={gridClasses}>
        {cityList.map((city, index) => {
          const slug = getSlugFromLink(city.link)
          const isFavorite = slug ? favoriteSlugs.has(slug) : false
          const isRecommended = slug ? recommendedSet.has(slug) : false
          const familySlug = getCityFamilySlug(slug)
          const showRightConnector =
            gridColumnCount > 1 &&
            familySlug !== null &&
            index % gridColumnCount !== gridColumnCount - 1 &&
            familySlug === getCityFamilySlug(getSlugFromLink(cityList[index + 1]?.link ?? ''))
          const showBottomConnector =
            gridColumnCount > 1 &&
            familySlug !== null &&
            familySlug === getCityFamilySlug(getSlugFromLink(cityList[index + gridColumnCount]?.link ?? ''))

          return (
            <Transition
              key={city.link}
              as="div"
              className="relative z-10"
              appear
              enterFrom="opacity-0 translate-y-3 scale-[0.98]"
              enter="transform-gpu transition-all ease-[cubic-bezier(0.22,1,0.36,1)] duration-240"
              enterTo="opacity-100 translate-y-0 scale-100"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leave="transform-gpu transition-all ease-in duration-180"
              leaveTo="opacity-0 -translate-y-1 scale-[0.98]"
              show
            >
              <CityCard
                city={city}
                variant={variant}
                visibleCities={navigationCities.length > 0 ? navigationCities : cityList}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                isRecommended={isRecommended}
                isMiniCity={isMiniCitySlug(slug)}
                showRightConnector={showRightConnector}
                showBottomConnector={showBottomConnector}
              />
            </Transition>
          )
        })}
      </div>
    )
  }

  const renderCountryGroups = (continent: string, cityList: ICity[]) => {
    const cityStatsBySlug = new Map(
      globalStats.cityBreakdown.map(({ slug, found, total }) => [slug, { found, total }]),
    )
    miniCityStatsMap.forEach(({ slug, found, total }) => {
      cityStatsBySlug.set(slug, { found, total })
    })
    const countryMap = new Map<string, ICity[]>()
    cityList.forEach((city) => {
      const country = getCountryFromLink(city.link) ?? 'unknown'
      const existing = countryMap.get(country)
      if (existing) {
        existing.push(city)
      } else {
        countryMap.set(country, [city])
      }
    })

    const sortedEntries = Array.from(countryMap.entries()).sort(([a], [b]) =>
      formatCountryLabel(a, settings.language).localeCompare(
        formatCountryLabel(b, settings.language),
      ),
    )

    return (
      <div className="space-y-8">
        {sortedEntries.map(([country, list]) => {
          let foundTotal = 0
          let stationTotal = 0
          list.forEach((city) => {
            const slug = getSlugFromLink(city.link)
            if (!slug) return
            const stats = cityStatsBySlug.get(slug)
            if (!stats) return
            foundTotal += Math.min(stats.found, stats.total)
            stationTotal += stats.total
          })
          const progressRatio = stationTotal > 0 ? foundTotal / stationTotal : 0
          const headerColor = getGradientColor(progressRatio)
          const progressLabel = `${(progressRatio * 100).toFixed(2)}%`
          const { cityCount, miniCityCount } = getDisplayedCityCounts(list)
          const cityCountLabel = t('cityCount', { count: cityCount })
          const miniCityCountLabel =
            miniCityCount > 0
              ? `, ${t('miniCityCountLabel', { count: miniCityCount })}`
              : ''
          const countrySectionId = getCountrySectionId(continent, country)

          return (
            <CollapsibleSection
              key={country}
              sectionId={countrySectionId}
              title={
                <span className="inline-flex items-center gap-2" style={{ color: headerColor }}>
                  <span aria-hidden="true" className="shrink-0 text-xl leading-none">
                    {getCountryFlagEmoji(country)}
                  </span>
                  <span>
                    {formatCountryLabel(country, settings.language)}{' \u00b7 '}{cityCountLabel}
                    {miniCityCountLabel}{' '}
                  <span className="text-sm font-semibold" style={{ color: headerColor }}>
                    ({progressLabel})
                  </span>
                  </span>
                </span>
              }
              titleAs="h4"
              className="space-y-4"
              headingClassName="text-lg font-semibold"
              contentClassName="mt-4"
            >
              {renderCityCollection(list)}
            </CollapsibleSection>
          )
        })}
      </div>
    )
  }

  const renderGlobalBar = (
    label: string,
    percent: number,
    detail?: string,
    showPointer = false,
  ) => {
    const clamped = clamp01(percent)
    const color = getGradientColor(clamped)
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#18181b] dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{label}</div>
          <div className="text-sm font-semibold" style={{ color }}>
            {(clamped * 100).toFixed(2)}%
          </div>
        </div>
        <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full transition-[width]"
            style={{
              width: `${(clamped * 100).toFixed(2)}%`,
              background: getBarBackground(clamped),
            }}
          />
          {showPointer && (
            <div
              className="pointer-events-none absolute -bottom-[10px] h-0 w-0"
              style={{
                left: `${(clamped * 100).toFixed(2)}%`,
                transform: 'translateX(-50%)',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `8px solid ${isDark ? '#ffffff' : '#000000'}`,
              }}
            />
          )}
        </div>
        {detail && (
          <p className="mt-2 text-xs font-semibold" style={{ color }}>
            {detail}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {shouldShowContinentNav && (
        <>
          <nav
            aria-label="Continent shortcuts"
            className={classNames(
              'fixed right-0 top-0 bottom-0 z-50 hidden w-64 bg-white/80 backdrop-blur-md transition-transform duration-300 dark:bg-zinc-900/80 lg:flex lg:flex-col border-l border-zinc-200 dark:border-zinc-800',
              continentNavOpen
                ? 'translate-x-0 shadow-2xl shadow-zinc-200/50 dark:shadow-black/20'
                : 'translate-x-full',
            )}
          >
            <div className="flex h-16 flex-shrink-0 items-center justify-center border-b border-zinc-200/50 px-4 dark:border-zinc-800/50">
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {t('continents')}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <div className="flex flex-col gap-1">
                {activeNavItems.map(
                  ({ continent, cityCount, miniCityCount = 0, sectionId, averagePercent, countries }) => {
              const translatedContinent =
                activeTab === 'achievements'
                  ? formatAchievementContinentLabel(continent, t)
                  : continent === 'Favorites'
                    ? t('favoriteCities') || 'Favorite Cities'
                    : CONTINENT_LABEL_KEYS[continent] !== undefined
                      ? t(CONTINENT_LABEL_KEYS[continent])
                      : continent
                  const countLabel =
                    activeTab === 'achievements'
                      ? t('achievementCountLabel', { count: cityCount })
                      : t('cityCount', { count: cityCount })
                  const miniCountLabel =
                    activeTab === 'cities' && miniCityCount > 0
                      ? `, ${t('miniCityCountLabel', { count: miniCityCount })}`
                      : ''
                  const percentLabel = `${(averagePercent * 100).toFixed(0)}%`
                  const percentColor = getGradientColor(averagePercent)
                  const isActive =
                    sectionId === activeSection ||
                    (activeSection !== null && activeSection.startsWith(`${sectionId}-country-`))
                  const isCollapsed = collapsedContinents[continent] ?? false
                  
                  return (
                    <div key={sectionId} className="space-y-1">
                  <div
                    className={classNames(
                      "group w-full rounded-xl px-3 py-3 text-left transition",
                      isActive
                        ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200 shadow-sm dark:bg-blue-900/30 dark:text-blue-50 dark:ring-blue-700/60"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleJumpToContinent(sectionId, continent)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className={classNames(
                                  "text-sm font-semibold transition",
                                  isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100"
                              )}>
                                  {translatedContinent}
                              </span>
                              
                              {isActive ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#2563eb] drop-shadow-[0_2px_6px_rgba(37,99,235,0.35)] dark:text-[#60a5fa]">
                                      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                  </svg>
                              ) : (
                                  <span 
                                      className="text-xs font-bold tabular-nums"
                                      style={{ color: percentColor }}
                                  >
                                      {percentLabel}
                                  </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
                              <span>{countLabel}{miniCountLabel}</span>
                              {isActive && (
                                  <span className="font-medium" style={{ color: percentColor }}>
                                      {percentLabel}
                                  </span>
                              )}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleContinentCollapse(continent)}
                            className="mt-0.5 rounded-md p-1 text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            aria-label={
                              isCollapsed
                                ? t('expandSectionLabel', { label: translatedContinent })
                                : t('collapseSectionLabel', { label: translatedContinent })
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className={classNames(
                                "h-4 w-4 transition-transform",
                                isCollapsed ? "rotate-0" : "rotate-90"
                              )}
                            >
                              <path fillRule="evenodd" d="M8.25 4.5l7.5 7.5-7.5 7.5" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {!isCollapsed && countries.length > 0 && (
                        <div className="ml-3 flex flex-col gap-1 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                          {countries.map((country) => {
                        const percent = `${(country.percent * 100).toFixed(0)}%`
                        const color = getGradientColor(country.percent)
                        const isCountryActive = activeSection === country.sectionId
                        return (
                          <button
                            key={country.sectionId}
                            type="button"
                            onClick={() => handleJumpToCountry(country.sectionId, continent, country.country)}
                            className={classNames(
                              "flex items-center justify-between rounded-lg px-2 py-1 text-left text-xs font-medium transition",
                              isCountryActive
                                ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200 shadow-sm dark:bg-blue-900/30 dark:text-blue-50 dark:ring-blue-700/60"
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-1">
                              <span aria-hidden="true" className="shrink-0">
                                {getCountryFlagEmoji(country.country)}
                              </span>
                              <span className="truncate">
                                {activeTab === 'achievements'
                                  ? formatAchievementCountryLabel(
                                      country.country,
                                      settings.language,
                                    )
                                  : country.label}
                              </span>
                            </span>
                            <span className="flex items-center gap-1 tabular-nums" style={{ color }}>
                              {percent}
                              {isCountryActive && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-3.5 w-3.5 text-[#2563eb] drop-shadow-[0_2px_6px_rgba(37,99,235,0.35)] dark:text-[#60a5fa]"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </span>
                          </button>
                        )
                      })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </nav>
          
          <button
            type="button"
            onClick={() => setContinentNavOpen((open) => !open)}
            className={classNames(
                "fixed top-32 z-40 hidden h-10 w-8 items-center justify-center rounded-l-xl border border-r-0 border-zinc-200 bg-white shadow-md transition-all hover:w-10 hover:bg-zinc-50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 lg:flex",
                continentNavOpen ? "right-64" : "right-0"
            )}
            style={{ transitionDuration: '300ms' }}
            aria-label={continentNavOpen ? 'Hide continent navigation' : 'Show continent navigation'}
          >
             {continentNavOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4 text-zinc-500 dark:text-zinc-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4 text-zinc-500 dark:text-zinc-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
             )}
          </button>
          
          <BackToTopButton className={continentNavOpen ? "right-8 lg:right-80 transition-all duration-300" : "right-8 transition-all duration-300"} />
        </>
      )}
      {sidebarTooltip && (
        <div
          className="pointer-events-none fixed left-24 z-[70] hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-lg ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100 dark:ring-white/10 lg:block"
          style={{ top: sidebarTooltip.top }}
          role="tooltip"
        >
          {sidebarTooltip.label}
        </div>
      )}
      {/* Left Sidebar Navigation (Desktop) */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-20 border-r border-zinc-200 bg-white/80 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 lg:flex">
        <div className="flex h-full w-full min-h-0 flex-col items-center">
          <div className="flex-1 overflow-y-auto overflow-x-visible px-2">
            <div className="flex flex-col items-center gap-4 pb-4">
              {PRIMARY_TABS.map(({ id, label }) => {
                const labelText = t(label)
                const Icon = TAB_ICONS[id]
                const isActive = activeTab === id
                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (id === 'home') {
                        navigateToHomeTab()
                        return
                      }
                      navigateToTab(id)
                    }}
                    className={classNames(
                      'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      isActive
                        ? 'bg-[var(--accent-600)] text-white shadow-md hover:bg-[var(--accent-700)] dark:bg-[var(--accent-500)] dark:hover:bg-[var(--accent-400)]'
                        : 'text-zinc-500 dark:text-zinc-400',
                    )}
                    aria-label={labelText}
                    title={labelText}
                    onMouseEnter={(event) => showSidebarTooltip(labelText, event.currentTarget)}
                    onMouseLeave={hideSidebarTooltip}
                    onFocus={(event) => showSidebarTooltip(labelText, event.currentTarget)}
                    onBlur={hideSidebarTooltip}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })}

              {SIDEBAR_ROUTE_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = item.match(pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={classNames(
                      'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      isActive
                        ? 'bg-[var(--accent-600)] text-white shadow-md hover:bg-[var(--accent-700)] dark:bg-[var(--accent-500)] dark:hover:bg-[var(--accent-400)]'
                        : 'text-zinc-500 dark:text-zinc-400',
                    )}
                    aria-label={item.label}
                    title={item.label}
                    onMouseEnter={(event) => showSidebarTooltip(item.label, event.currentTarget)}
                    onMouseLeave={hideSidebarTooltip}
                    onFocus={(event) => showSidebarTooltip(item.label, event.currentTarget)}
                    onBlur={hideSidebarTooltip}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                )
              })}

              {SECONDARY_TABS.map(({ id, label }) => {
                const labelText = t(label)
                const Icon = TAB_ICONS[id]
                const isActive = activeTab === id
                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (id === 'home') {
                        navigateToHomeTab()
                        return
                      }
                      navigateToTab(id)
                    }}
                    className={classNames(
                      'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      isActive
                        ? 'bg-[var(--accent-600)] text-white shadow-md hover:bg-[var(--accent-700)] dark:bg-[var(--accent-500)] dark:hover:bg-[var(--accent-400)]'
                        : 'text-zinc-500 dark:text-zinc-400',
                    )}
                    aria-label={labelText}
                    title={labelText}
                    onMouseEnter={(event) => showSidebarTooltip(labelText, event.currentTarget)}
                    onMouseLeave={hideSidebarTooltip}
                    onFocus={(event) => showSidebarTooltip(labelText, event.currentTarget)}
                    onBlur={hideSidebarTooltip}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="mx-auto h-px w-10 bg-zinc-200 dark:bg-zinc-800" />

            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label={t('theme')}
              title={t('theme')}
              onMouseEnter={(event) => showSidebarTooltip(t('theme'), event.currentTarget)}
              onMouseLeave={hideSidebarTooltip}
              onFocus={(event) => showSidebarTooltip(t('theme'), event.currentTarget)}
              onBlur={hideSidebarTooltip}
            >
              {mounted && resolvedTheme === 'dark' ? (
                  <MdLightMode className="h-5 w-5" />
              ) : (
                  <MdDarkMode className="h-5 w-5" />
              )}
            </button>

            <a
              href="https://github.com/kirklandwaterbot/metro-memory"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label="GitHub"
              title="GitHub"
              onMouseEnter={(event) => showSidebarTooltip('GitHub', event.currentTarget)}
              onMouseLeave={hideSidebarTooltip}
              onFocus={(event) => showSidebarTooltip('GitHub', event.currentTarget)}
              onBlur={hideSidebarTooltip}
            >
              <GitHubIcon className="h-5 w-5 fill-current" />
            </a>
          </div>
        </div>
      </aside>

      <div className="my-16 mt-16 sm:mt-20 lg:pl-20">
        {/* Top Navigation (Mobile/Tablet) & Action Bar (Desktop Sticky) */}
        <div className={classNames(
          "z-30 mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/70 lg:sticky lg:top-6",
          !['cities', 'achievements'].includes(activeTab) && "lg:hidden"
        )}>
          <div className="lg:hidden">
          <div className="flex overflow-x-auto pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 hide-scrollbar">
            {[...PRIMARY_TABS, ...SECONDARY_TABS].map(({ id, label }) => {
              const labelText = t(label)
              const Icon = TAB_ICONS[id]
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (id === 'home') {
                        navigateToHomeTab()
                        return
                    }
                    navigateToTab(id)
                  }}
                  aria-label={labelText}
                  className={classNames(
                    'group mr-2 inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold transition sm:mr-0',
                    activeTab === id
                      ? 'bg-[var(--accent-600)] text-white dark:bg-[var(--accent-500)]'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{labelText}</span>
                  <span
                    className={classNames(
                      'max-w-0 overflow-hidden whitespace-nowrap pl-0 text-sm opacity-0 transition-all duration-200',
                      'group-hover:max-w-xs group-hover:pl-2 group-hover:opacity-100 group-hover:translate-x-0',
                      'group-focus-visible:max-w-xs group-focus-visible:pl-2 group-focus-visible:opacity-100 group-focus-visible:translate-x-0',
                    )}
                  >
                    {labelText}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'cities' && (
           <>
             <div className="h-px w-full bg-zinc-200/80 dark:bg-zinc-800/80 lg:hidden" />
             <div className="flex flex-col gap-2 transition-all lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="block w-full rounded-full border-0 px-4 py-2.5 pl-10 text-base text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--accent-600)] sm:px-10 sm:py-4 sm:leading-6 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-[var(--accent-400)]"
                type="text"
                placeholder={t('searchCities')}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-zinc-400 sm:left-auto sm:right-0 sm:pl-0 sm:pr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" className="sm:h-8 sm:w-8">
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:w-auto">
              {!isMapView && (
                <div className="w-full sm:w-44 lg:w-40">
                <label className="sr-only" htmlFor="city-sort">
                  Sort cities
                </label>
                <div className="relative">
                    <select
                      id="city-sort"
                      value={citySort}
                      onChange={(event) => setCitySort(event.target.value as CitySortOption)}
                      className={classNames(
                        "w-full appearance-none rounded-full border-0 bg-white px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[var(--accent-600)] sm:appearance-auto sm:py-3 sm:pr-10 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-[var(--accent-400)]",
                      )}
                    >
                      {CITY_SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.label)}
                        </option>
                      ))}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 sm:hidden">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                    </div>
                </div>
              </div>
              )}
              <div className="w-full sm:w-44 lg:w-40">
                <label className="sr-only" htmlFor="city-view">
                  View
                </label>
                <div className="relative">
                    <select
                      id="city-view"
                      value={cityViewMode}
                      onChange={(event) => setCityViewMode(event.target.value as CityCardVariant)}
                      className="w-full appearance-none rounded-full border-0 bg-white px-4 py-2.5 pr-8 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[var(--accent-600)] sm:appearance-auto sm:py-3 sm:pr-10 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-[var(--accent-400)]"
                    >
                      {CITY_VIEW_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.label)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 sm:hidden">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                    </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className={clsx(
                  "group flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] dark:focus:ring-[var(--accent-400)] whitespace-nowrap",
                  isLocating
                    ? "border-yellow-300 bg-yellow-100 text-yellow-800 opacity-70 dark:border-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100"
                    : "border-yellow-300 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:border-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100 dark:hover:bg-yellow-500/30"
                )}
              >
                <MdMyLocation className="h-5 w-5" />
                <span className="sr-only">
                  {isLocating
                    ? getLabel('locating', 'Locating...')
                    : getLabel('getLocation', 'Get location')}
                </span>
                <span
                  className={classNames(
                    'max-w-0 overflow-hidden whitespace-nowrap pl-0 text-sm opacity-0 transition-all duration-200',
                    'group-hover:max-w-xs group-hover:pl-2 group-hover:opacity-100 group-hover:translate-x-0',
                    'group-focus-visible:max-w-xs group-focus-visible:pl-2 group-focus-visible:opacity-100 group-focus-visible:translate-x-0',
                  )}
                >
                  {isLocating
                    ? getLabel('locating', 'Locating...')
                    : getLabel('getLocation', 'Get location')}
                </span>
              </button>
              
              {(cityViewMode === 'globe' || cityViewMode === 'map') && (
                <button
                    onClick={() => setIsSatellite(!isSatellite)}
                    className={clsx(
                        "group col-span-2 sm:col-span-1 flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] dark:focus:ring-[var(--accent-400)]",
                        isSatellite 
                            ? "border-[var(--accent-600)] bg-[var(--accent-600)] text-white hover:bg-[var(--accent-700)] dark:border-[var(--accent-500)] dark:bg-[var(--accent-500)] dark:text-zinc-900 dark:hover:bg-[var(--accent-400)]"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    )}
                >
                    <MdSatellite className="h-5 w-5" />
                    <span className="sr-only">{t('satelliteView')}</span>
                    <span
                      className={classNames(
                        'max-w-0 overflow-hidden whitespace-nowrap pl-0 text-sm opacity-0 transition-all duration-200',
                        'group-hover:max-w-xs group-hover:pl-2 group-hover:opacity-100 group-hover:translate-x-0',
                        'group-focus-visible:max-w-xs group-focus-visible:pl-2 group-focus-visible:opacity-100 group-focus-visible:translate-x-0',
                      )}
                    >
                      {t('satelliteView')}
                    </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFavoritesOnly((v) => !v)}
                className={clsx(
                  "group flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] dark:focus:ring-[var(--accent-400)]",
                  showFavoritesOnly
                    ? "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-500/20 dark:text-rose-100"
                    : favoriteSlugs.size > 0
                      ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      : "border-gray-200 bg-gray-50 text-gray-400 cursor-default dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-600"
                )}
              >
                {showFavoritesOnly ? <MdFavorite className="h-5 w-5" /> : <MdFavoriteBorder className="h-5 w-5" />}
                <span className="sr-only">Favorites</span>
              </button>
              <button
                type="button"
                onClick={handlePlayRandomCity}
                className={clsx(
                  "group flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] dark:focus:ring-[var(--accent-400)]",
                  "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <MdShuffle className="h-5 w-5" />
                <span className="sr-only">
                  {getLabel('playRandomCity', 'Play Random City')}
                </span>
                <span
                  className={classNames(
                    'max-w-0 overflow-hidden whitespace-nowrap pl-0 text-sm opacity-0 transition-all duration-200',
                    'group-hover:max-w-xs group-hover:pl-2 group-hover:opacity-100 group-hover:translate-x-0',
                    'group-focus-visible:max-w-xs group-focus-visible:pl-2 group-focus-visible:opacity-100 group-focus-visible:translate-x-0',
                  )}
                >
                  {getLabel('playRandomCity', 'Play Random City')}
                </span>
              </button>
              {canToggleHomeMapProvider &&
                (cityViewMode === 'globe' || cityViewMode === 'map') && (
                  <button
                    type="button"
                    onClick={() =>
                      setMapProvider((prev) => (prev === 'amap' ? 'mapbox' : 'amap'))
                    }
                    title={
                      mapProvider === 'amap'
                        ? getLabel('useMapboxMap', 'Use Mapbox')
                        : getLabel('useAmapMap', 'Use AMap')
                    }
                    className={clsx(
                      "group flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] dark:focus:ring-[var(--accent-400)]",
                      mapProvider === 'amap'
                        ? "border-[var(--accent-600)] bg-[var(--accent-600)] text-white hover:bg-[var(--accent-700)] dark:border-[var(--accent-500)] dark:bg-[var(--accent-500)] dark:text-zinc-900 dark:hover:bg-[var(--accent-400)]"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <MdPublic className="h-5 w-5" />
                    <span className="sr-only">
                      {mapProvider === 'amap'
                        ? getLabel('useMapboxMap', 'Use Mapbox')
                        : getLabel('useAmapMap', 'Use AMap')}
                    </span>
                    <span
                      className={classNames(
                        'max-w-0 overflow-hidden whitespace-nowrap pl-0 text-sm opacity-0 transition-all duration-200',
                        'group-hover:max-w-xs group-hover:pl-2 group-hover:opacity-100 group-hover:translate-x-0',
                        'group-focus-visible:max-w-xs group-focus-visible:pl-2 group-focus-visible:opacity-100 group-focus-visible:translate-x-0',
                      )}
                    >
                      {mapProvider === 'amap' ? 'AMap' : 'Mapbox'}
                    </span>
                  </button>
                )}
            </div>
            </div>
           </>
        )}
        {activeTab === 'achievements' && (
          <>
            <div className="h-px w-full bg-zinc-200/80 dark:bg-zinc-800/80" />
            <div className="flex flex-col gap-2 transition-all lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full">
                <input
                  value={achievementSearch}
                  onChange={(event) => setAchievementSearch(event.target.value)}
                  type="text"
                  placeholder={t('searchAchievements')}
                  className="block w-full rounded-full border-0 px-4 py-2.5 pl-10 text-base text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--accent-600)] sm:px-10 sm:py-4 sm:leading-6 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-[var(--accent-400)]"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-zinc-400 sm:left-auto sm:right-0 sm:pl-0 sm:pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" className="sm:h-8 sm:w-8">
                    <path
                      fill="currentColor"
                      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"
                    />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center lg:w-auto">
                <div className="w-full sm:w-56">
                  <label className="sr-only" htmlFor="achievement-sort">
                    {t('sortAchievements')}
                  </label>
                  <select
                    id="achievement-sort"
                    value={achievementSort}
                    onChange={(event) => setAchievementSort(event.target.value as AchievementSortOption)}
                    className="w-full rounded-full border-0 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[var(--accent-600)] sm:py-3 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-[var(--accent-400)]"
                  >
                    {ACHIEVEMENT_SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}
        </div>

      {activeTab === 'cities' ? (
        <>
          {cityViewMode === 'globe' || cityViewMode === 'map' ? (
             <div ref={mapSectionRef} className="mt-6">
                <CitiesGlobe 
                  cities={navigationCities} 
                  cityProgress={cityProgress}
                  projection={cityViewMode === 'map' ? 'mercator' : 'globe'} 
                  satellite={isSatellite}
                  mapProvider={mapProvider}
                  recommendedSlugs={recommendedSlugs}
                  favoriteSlugs={favoriteSlugs}
                  onToggleFavorite={toggleFavorite}
                  userLocation={userLocation}
                  selectedContinent={continentFocus?.name}
                  continentFocusVersion={continentFocus?.token}
                  selectedCountry={countryFocus?.name}
                  countryFocusVersion={countryFocus?.token}
                />
             </div>
          ) : hasCityResults ? (
            <div className="space-y-10">
              {!showFavoritesOnly && recentCities.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <MdHistory className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                      Recently Played
                    </h3>
                  </div>
                  {renderCityCollection(recentCities)}
                  <hr className="mt-6 border-t border-zinc-200 dark:border-zinc-800" />
                </section>
              )}
              {groupsWithFavorites.map(({ continent, cities }, index) => {
                const { cityCount, miniCityCount } = getDisplayedCityCounts(cities)
                const cityGrid = renderCountryGroups(continent, cities)
                const translatedContinent =
                  continent === 'Favorites'
                    ? t('favoriteCities') || 'Favorite Cities'
                    : CONTINENT_LABEL_KEYS[continent] !== undefined
                      ? t(CONTINENT_LABEL_KEYS[continent])
                      : continent
                const cityCountLabel = t('cityCount', { count: cityCount })
                const miniCityCountLabel =
                  miniCityCount > 0
                    ? `, ${t('miniCityCountLabel', { count: miniCityCount })}`
                    : ''

                const isCollapsible = COLLAPSIBLE_CONTINENTS.has(continent)
                const sectionId = getContinentSectionId(continent)

                const totalProgress = cities.reduce((acc, city) => {
                  const slug = getSlugFromLink(city.link)
                  const progress = slug ? (cityProgress[slug] ?? 0) : 0
                  return acc + progress
                }, 0)
                const averageProgress = cities.length > 0 ? totalProgress / cities.length : 0
                const headerColor = getGradientColor(averageProgress)
                const averageProgressLabel = `${(averageProgress * 100).toFixed(2)}%`

                return (
                  <Fragment key={continent}>
                    {isCollapsible ? (
                      <CollapsibleSection
                        sectionId={sectionId}
                        title={
                          <span style={{ color: headerColor }}>
                            {translatedContinent}{' \u00b7 '}{cityCountLabel}
                            {miniCityCountLabel} ({averageProgressLabel})
                          </span>
                        }
                    titleAs="h3"
                    className="space-y-6"
                    headingClassName="text-xl font-semibold text-zinc-800 dark:text-zinc-100"
                    contentClassName="mt-4"
                  >
                    {cityGrid}
                      </CollapsibleSection>
                    ) : (
                      <section id={sectionId} className="space-y-6 scroll-mt-28">
                        <div>
                          <h3
                            className="mb-4 text-xl font-semibold"
                            style={{ color: headerColor }}
                          >
                            {translatedContinent}{' '}
                            <span className="text-base font-normal" style={{ color: headerColor }}>{' \u00b7 '}{cityCountLabel}
                              {miniCityCountLabel} ({averageProgressLabel})
                            </span>
                          </h3>
                          {cityGrid}
                        </div>
                      </section>
                    )}
                    {index < groupsWithFavorites.length - 1 && (
                      <footer>
                        <hr className="border-t border-zinc-200 dark:border-[#18181b]" />
                      </footer>
                    )}
                  </Fragment>
                )
              })}
            </div>
          ) : (
            <EmptyState />
          )}
          {hasCityResults && <SuggestCity />}
        </>
      ) : activeTab === 'globalStats' ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{t('tabGlobalStats')}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t('globalStatsSubtitle')}
            </p>
          </div>
          {renderGlobalBar(
            t('globalOverallCompletion'),
            globalStats.percentFound,
            t('globalOverallDetail', {
              found: globalStats.totalStationsFound.toLocaleString(),
              total: globalStats.totalStations.toLocaleString(),
            }),
            true,
          )}

          {globalStats.continentBreakdown.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#18181b] dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                    {t('globalByContinentTitle')}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t('globalByContinentDesc')}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t('cityStatsStationsProgress')}
                </span>
              </div>
                <div className="divide-y divide-zinc-200 dark:divide-[#18181b]">
                  {globalStats.continentBreakdown.map((entry) => {
                    const percentLabel = `${(clamp01(entry.percent) * 100).toFixed(2)}%`
                    const barBg = getBarBackground(entry.percent)
                    const translatedContinent =
                      CONTINENT_LABEL_KEYS[entry.continent] !== undefined
                        ? t(CONTINENT_LABEL_KEYS[entry.continent])
                        : entry.continent
                    return (
                      <div key={entry.continent} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                              {translatedContinent}
                            </span>
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                              {t('globalContinentDetail', {
                                cityCount: t('cityCount', { count: entry.cityCount }),
                                found: entry.found.toLocaleString(),
                              total: entry.total.toLocaleString(),
                              stations: t('stations', { count: entry.total }),
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: getGradientColor(entry.percent) }}
                          >
                            {percentLabel}
                          </span>
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full"
                              style={{ width: percentLabel, background: barBg }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t('globalCompletedCities')}
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {globalStats.completedCities}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t('globalInProgress')}
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-500">{globalStats.partialCities}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t('globalNotStarted')}
              </p>
              <p className="mt-1 text-2xl font-bold text-red-500">{globalStats.notStartedCities}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t('globalTotalCities')}
              </p>
              <p
                className="mt-1 text-2xl font-bold"
                style={{ color: getGradientColor(globalStats.percentFound) }}
              >
                {globalStats.cityBreakdown.length}
              </p>
            </div>
          </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#18181b] dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                    {t('globalByCityTitle')}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t('globalByCityHint')}
                  </p>
                </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t('cityStatsStationsProgress')}
              </span>
            </div>
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <input
                  value={globalStatsSearch}
                  onChange={(event) => setGlobalStatsSearch(event.target.value)}
                  className="block w-full rounded-full border-0 px-4 py-3 pr-10 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--accent-600)] dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:placeholder:text-zinc-500 dark:focus:ring-[var(--accent-400)]"
                  type="text"
                  placeholder={t('globalSearchCities')}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-zinc-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"
                    />
                  </svg>
                </div>
              </div>
              <div className="w-full md:w-64">
                <label className="sr-only" htmlFor="global-stats-city-sort">
                  {t('globalSortCities')}
                </label>
                <select
                  id="global-stats-city-sort"
                  value={globalStatsSort}
                  onChange={(event) => setGlobalStatsSort(event.target.value as CitySortOption)}
                  className="w-full rounded-full border-0 bg-white px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[var(--accent-600)] dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 dark:focus:ring-[var(--accent-400)]"
                >
                  {CITY_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.label as any)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-[#18181b]">
              {visibleCityBreakdown.map((entry) => {
                const percentLabel = `${(clamp01(entry.percent) * 100).toFixed(1)}%`
                const statusClass = getStatusClass(entry.percent)
                const barBg = getBarBackground(entry.percent)
                return (
                  <div key={entry.slug} className="px-1 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-start sm:gap-3">
                        <span className="flex items-center gap-3">
                          <AchievementIcon
                            slug={entry.slug}
                            cityName={entry.name}
                            className="h-16 w-16 sm:h-20 sm:w-20"
                            imageClassName="object-contain"
                            sizes="80px"
                          />
                          <span className={classNames('text-base font-semibold', statusClass)}>
                            {entry.name}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: getGradientColor(entry.percent) }}
                        >
                          {percentLabel}
                        </span>
                        <div className="relative">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full"
                              style={{ width: percentLabel, background: barBg }}
                            />
                          </div>
                          <span
                            className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs font-bold"
                            style={{ color: getGradientColor(entry.percent) }}
                          >
                            {entry.found}/{entry.total} {t('stationsFound')}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-semibold text-zinc-700 transition hover:bg-[var(--accent-50)] hover:text-[var(--accent-600)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            openStatsPanelForCity(entry.slug)
                          }}
                          aria-label={t('openCityStats')}
                        >
                          <span aria-hidden="true">...</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-3 text-sm text-zinc-700 dark:text-zinc-200" />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#18181b] dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                  {t('globalMiniCitiesTitle')}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t('globalMiniCitiesDesc')}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t('cityStatsStationsProgress')}
              </span>
            </div>
            {renderGlobalBar(
              t('globalMiniCityCompletion'),
              globalStats.miniPercentFound,
              t('globalOverallDetail', {
                found: globalStats.miniTotalStationsFound.toLocaleString(),
                total: globalStats.miniTotalStations.toLocaleString(),
              }),
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-950 dark:text-zinc-100">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t('globalCompletedCities')}
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {globalStats.miniCompletedCities}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-950 dark:text-zinc-100">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t('globalInProgress')}
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-500">
                  {globalStats.miniPartialCities}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-950 dark:text-zinc-100">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t('globalNotStarted')}
                </p>
                <p className="mt-1 text-2xl font-bold text-red-500">
                  {globalStats.miniNotStartedCities}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-800 shadow-sm dark:border-[#18181b] dark:bg-zinc-950 dark:text-zinc-100">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {t('globalTotalMiniCities')}
                </p>
                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: getGradientColor(globalStats.miniPercentFound) }}
                >
                  {globalStats.miniCityBreakdown.length}
                </p>
              </div>
            </div>
            {globalStats.miniContinentBreakdown.length > 0 && (
              <div className="mt-4 divide-y divide-zinc-200 dark:divide-[#18181b]">
                {globalStats.miniContinentBreakdown.map((entry) => {
                  const percentLabel = `${(clamp01(entry.percent) * 100).toFixed(2)}%`
                  const translatedContinent =
                    CONTINENT_LABEL_KEYS[entry.continent] !== undefined
                      ? t(CONTINENT_LABEL_KEYS[entry.continent])
                      : entry.continent
                  return (
                    <div key={`mini-${entry.continent}`} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                            {translatedContinent}
                          </span>
                          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                            {t('globalMiniContinentDetail', {
                              cityCount: entry.cityCount.toLocaleString(),
                              found: entry.found.toLocaleString(),
                              total: entry.total.toLocaleString(),
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: getGradientColor(entry.percent) }}
                          >
                            {percentLabel}
                          </span>
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: percentLabel,
                                background: getBarBackground(entry.percent),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-4 divide-y divide-zinc-200 dark:divide-[#18181b]">
              {visibleMiniCityBreakdown.map((entry) => {
                  const percentLabel = `${(clamp01(entry.percent) * 100).toFixed(1)}%`
                  const statusClass = getStatusClass(entry.percent)
                  const barBg = getBarBackground(entry.percent)
                  const localizedName = formatLocalizedCityName(
                    entry.name,
                    entry.slug,
                    settings.language,
                  )
                  const localizedParentName = formatLocalizedCityName(
                    entry.parentName,
                    entry.parentSlug,
                    settings.language,
                  )
                  return (
                    <div key={entry.slug} className="px-1 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-start sm:gap-3">
                          <span className="flex items-center gap-3">
                          <AchievementIcon
                            slug={entry.slug}
                            cityName={entry.name}
                            className="h-16 w-16 sm:h-20 sm:w-20"
                            imageClassName="object-contain"
                            sizes="80px"
                            />
                            <span className="flex flex-col">
                              <span className={classNames('text-base font-semibold', statusClass)}>
                              {localizedName}
                              </span>
                              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              {localizedParentName}
                              </span>
                            </span>
                          </span>
                        </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: getGradientColor(entry.percent) }}
                        >
                          {percentLabel}
                        </span>
                        <div className="relative">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full"
                              style={{ width: percentLabel, background: barBg }}
                            />
                          </div>
                          <span
                            className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs font-bold"
                            style={{ color: getGradientColor(entry.percent) }}
                          >
                            {entry.found}/{entry.total} {t('stationsFound')}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-semibold text-zinc-700 transition hover:bg-[var(--accent-50)] hover:text-[var(--accent-600)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] dark:border-[#18181b] dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            openStatsPanelForCity(entry.slug)
                          }}
                          aria-label={t('openCityStats')}
                        >
                          <span aria-hidden="true">...</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : activeTab === 'achievements' ? (
        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {t('mainCitiesTitle')}
            </h3>
            <Achievements
              items={visibleAchievements}
              groups={achievementGroups}
              unlockedData={unlockedData}
              progressMap={achievementProgress}
              totalCount={achievementCatalog.length}
              totalUnlocked={achievementCatalog.filter((entry) => unlockedData.has(entry.slug)).length}
              timezone={settings.timezone}
              language={settings.language}
            />
          </div>
          <div>
            <h3 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {t('globalMiniCitiesTitle')}
            </h3>
            <Achievements
              items={visibleMiniAchievements}
              groups={miniAchievementGroups}
              unlockedData={unlockedData}
              progressMap={achievementProgress}
              totalCount={miniCityAchievementCatalog.length}
              totalUnlocked={miniCityAchievementCatalog.filter((entry) => unlockedData.has(entry.slug)).length}
              timezone={settings.timezone}
              language={settings.language}
            />
          </div>
        </div>
      ) : activeTab === 'updateLog' ? (
        <UpdateLogPanel state={updateLogState} />
      ) : activeTab === 'credits' ? (
        <div className="flex justify-center">
          <CreditsContent showBackLink={false} />
        </div>
      ) : activeTab === 'account' ? (
        <div className="mx-auto w-full max-w-3xl">
          <AccountDashboard />
        </div>
      ) : activeTab === 'testimonials' ? (
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            What people say about Metro Memory
          </h3>
          {testimonialsContent ?? (
            <MissingTabContent message="No testimonials available right now." />
          )}
        </div>
      ) : activeTab === 'settings' ? (
        <SettingsPanel disableScroll />
      ) : activeTab === 'press' ? (
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            They talked about us
          </h3>
          {pressContent ?? (
            <MissingTabContent message="No press mentions available right now." />
          )}
        </div>
      ) : activeTab === 'privacy' ? (
        <PrivacyPanel />
  ) : null}
    </div>
    <Transition
      show={Boolean(favoriteToast)}
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="translate-y-4 opacity-0 scale-95"
      enterTo="translate-y-0 opacity-100 scale-100"
      leave="transform transition ease-in duration-150"
      leaveFrom="translate-y-0 opacity-100 scale-100"
      leaveTo="translate-y-4 opacity-0 scale-95"
    >
      <div className="pointer-events-auto fixed bottom-6 left-1/2 z-[90] w-full max-w-sm -translate-x-1/2 px-4 sm:px-0">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white/95 p-4 text-left shadow-2xl backdrop-blur dark:border-amber-500/60 dark:bg-zinc-900/95">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 4.75l2.09 4.24 4.68.68-3.39 3.3.8 4.66L12 15.9l-4.18 2.2.8-4.66-3.39-3.3 4.68-.68L12 4.75z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {favoriteToast?.message}
            </p>
          </div>
          <CloseButton
            ariaLabel="Dismiss favorites notification"
            onClick={() => setFavoriteToast(null)}
            className="ml-2 h-7 w-7 text-zinc-500 hover:text-zinc-800 focus:ring-amber-400 dark:text-zinc-300 dark:hover:text-white"
            iconClassName="h-4 w-4"
          />
        </div>
      </div>
    </Transition>
    {statsOpen && statsSlug && (
      <CityStatsPanel
        cityDisplayName={statsCityDisplayName || 'City Statistics'}
        slug={statsSlug}
        cityPath={statsPath}
        open={statsOpen}
        onClose={() => {
          setStatsOpen(false)
          setStatsSlug(null)
          setStatsPath(null)
        }}
        onNavigatePrevious={
          !statsSlugIsMiniCity && statsNavigation && statsNavigation.slugs.length > 1
            ? handlePrevStats
            : undefined
        }
        onNavigateNext={
          !statsSlugIsMiniCity && statsNavigation && statsNavigation.slugs.length > 1
            ? handleNextStats
            : undefined
        }
      />
    )}
    </>
  )
}

const Achievements = ({
  items,
  groups,
  unlockedData,
  progressMap,
  totalCount,
  totalUnlocked,
  timezone,
  language,
}: {
  items: AchievementMeta[]
  groups: AchievementContinentGroup[]
  unlockedData: Map<string, number>
  progressMap: Map<string, AchievementProgressData>
  totalCount: number
  totalUnlocked: number
  timezone?: string
  language?: string
}) => {
  const { t } = useTranslation()
  const unlockedSet = useMemo(() => new Set(unlockedData.keys()), [unlockedData])
  const hasResults = items.length > 0
  const totalProgress = totalCount > 0 ? totalUnlocked / totalCount : 0
  const totalProgressColor = getGradientColor(totalProgress)

    const formatAchievementDate = (timestamp: number) => {
      if (!timestamp) return ''
      try {
        return new Intl.DateTimeFormat(resolveI18nLocaleCode(language), {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: timezone,
      }).format(new Date(timestamp))
    } catch {
      return ''
    }
  }

    const renderAchievementCard = (meta: AchievementMeta) => {
      const isUnlocked = unlockedSet.has(meta.slug)
      const displayMeta = formatAchievementDisplayMeta(meta, language)
      const unlockTimestamp = unlockedData.get(meta.slug) ?? 0
      const unlockDateLabel = isUnlocked ? formatAchievementDate(unlockTimestamp) : ''
    const progressMeta = progressMap.get(meta.slug)
    const hasProgress = Boolean(progressMeta)
    const currentRaw = progressMeta?.current ?? 0
    const targetRaw = progressMeta?.target ?? 0
    const safeTarget = targetRaw > 0 ? targetRaw : 0
    const displayCurrent = isUnlocked && safeTarget > 0 ? safeTarget : currentRaw
    const ratio = safeTarget > 0 ? clamp01(displayCurrent / safeTarget) : 0
    const progressRatio = hasProgress ? ratio : null
    const showProgress = typeof progressRatio === 'number'
    const progressColor = showProgress ? getGradientColor(progressRatio) : ''
    const progressTrack = showProgress
      ? getGradientColor(progressRatio).replace('hsl(', 'hsla(').replace(')', ', 0.18)')
      : ''
    const percentLabel = showProgress ? `${Math.round(progressRatio * 100)}%` : ''
    const numericLabel =
      showProgress && safeTarget > 0
        ? `${Math.min(displayCurrent, safeTarget)} / ${safeTarget}`
        : ''

      const isSecret = meta.country === 'secret-fun'
      const description =
        isSecret && !isUnlocked
          ? '???'
          : displayMeta.secretDescription
            ? displayMeta.secretDescription
            : displayMeta.description
      const continentLabel = formatAchievementContinentLabel(meta.continent, t)

      return (
        <div
        key={meta.slug}
        className={classNames(
          'flex flex-col gap-4 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
          isUnlocked
            ? 'border-emerald-200 bg-white dark:border-emerald-600/60 dark:bg-zinc-900'
            : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-[#18181b] dark:bg-zinc-900/40 dark:text-zinc-500',
        )}
      >
          <div className="flex flex-1 items-stretch gap-4">
            <AchievementIcon
              slug={meta.slug}
              cityName={displayMeta.cityName}
              className="h-full min-h-[4.5rem] w-20 p-1"
              sizes="80px"
              iconSrc={meta.iconSrc}
          />
          <div className="min-w-0 flex-1">
            <OverflowMarquee
              className={classNames(
                'max-w-full text-lg font-semibold',
                isUnlocked ? 'text-zinc-800 dark:text-zinc-100' : '',
              )}
              speed={30}
              minDuration={8}
              gap={24}
              title={displayMeta.title}
            >
              {displayMeta.title}
            </OverflowMarquee>
            <OverflowMarquee
              className="mt-1 max-w-full text-sm text-zinc-600 dark:text-zinc-400"
              speed={34}
              minDuration={9}
              gap={24}
              title={description}
            >
              {description}
            </OverflowMarquee>
            {showProgress && (
              <div className="mt-3">
                <div
                  className="h-2 w-full rounded-full"
                  style={{ background: progressTrack }}
                >
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(clamp01(progressRatio) * 100).toFixed(2)}%`,
                      background: progressColor,
                    }}
                  />
                </div>
                <div className="mt-1 text-xs font-semibold" style={{ color: progressColor }}>
                  {numericLabel}{' \u00b7 '}{percentLabel}
                </div>
              </div>
              )}
              <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {displayMeta.cityName} • {continentLabel}
              </p>
            </div>
          </div>
        <span
          className={classNames(
            'text-sm font-semibold',
            isUnlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
          )}
        >
          {isUnlocked ? (
            <div className="flex flex-col items-end">
              <span>{t('achievementUnlocked')}</span>
              {unlockDateLabel && (
                <span className="text-xs font-normal opacity-80">{unlockDateLabel}</span>
              )}
            </div>
          ) : (
            t('achievementLocked')
          )}
        </span>
      </div>
    )
    }

    const formatAchievementCount = (count: number) =>
      t('achievementCountLabel', { count })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${(clamp01(totalProgress) * 100).toFixed(2)}%`,
              background: totalProgressColor,
            }}
          />
        </div>
        <div className="flex flex-col gap-1 text-sm font-semibold md:flex-row md:items-center md:gap-6">
        <span className="text-emerald-600">
          {t('unlockedAchievements', { unlocked: totalUnlocked, total: totalCount })}
        </span>
        <span className="text-red-500">
          {t('lockedAchievements', { locked: Math.max(totalCount - totalUnlocked, 0) })}
        </span>
        </div>
      </div>

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-[#18181b] dark:text-zinc-400">
          {t('noAchievementsFound')}
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group, index) => {
            const total = group.countries.reduce((sum, country) => sum + country.entries.length, 0)
            const unlocked = group.countries.reduce(
              (sum, country) =>
                sum + country.entries.filter((entry) => unlockedSet.has(entry.slug)).length,
              0,
            )
              const progressRatio = total > 0 ? unlocked / total : 0
              const headerColor = getGradientColor(progressRatio)
              const progressLabel = `${(progressRatio * 100).toFixed(2)}%`
              const translatedContinent = formatAchievementContinentLabel(group.continent, t)
              const cityCountLabel = formatAchievementCount(total)
              const sectionId = getContinentSectionId(group.continent)

            return (
              <Fragment key={group.continent}>
                <CollapsibleSection
                  sectionId={sectionId}
                  title={
                    <span style={{ color: headerColor }}>
                      {translatedContinent}{' '}
                      <span className="text-base font-normal" style={{ color: headerColor }}>{' \u00b7 '}{cityCountLabel} ({progressLabel})
                      </span>
                    </span>
                  }
                  titleAs="h3"
                  className="space-y-6"
                  headingClassName="text-xl font-semibold text-zinc-800 dark:text-zinc-100"
                  contentClassName="mt-4"
                >
                  <div className="space-y-8">
                    {group.countries.map((country) => {
                      const countryUnlocked = country.entries.filter((entry) =>
                        unlockedSet.has(entry.slug),
                      ).length
                        const countryTotal = country.entries.length
                        const countryProgress = countryTotal > 0 ? countryUnlocked / countryTotal : 0
                        const countryHeaderColor = getGradientColor(countryProgress)
                        const countryProgressLabel = `${(countryProgress * 100).toFixed(2)}%`
                        const countryLabel = formatAchievementCountryLabel(
                          country.country,
                          language,
                        )
                        const countryCountLabel = formatAchievementCount(countryTotal)
                        const countrySectionId = getCountrySectionId(group.continent, country.country)

                      return (
                        <CollapsibleSection
                          key={country.country}
                          sectionId={countrySectionId}
                          title={
                            <span style={{ color: countryHeaderColor }}>
                              {group.continent !== 'Global' && country.country && (
                                <span aria-hidden="true" className="mr-1.5">
                                  {getCountryFlagEmoji(country.country)}
                                </span>
                              )}
                              {countryLabel}{' \u00b7 '}{countryCountLabel}{' '}
                              <span
                                className="text-sm font-semibold"
                                style={{ color: countryHeaderColor }}
                              >
                                ({countryProgressLabel})
                              </span>
                            </span>
                          }
                          titleAs="h4"
                          className="space-y-4"
                          headingClassName="text-lg font-semibold"
                          contentClassName="mt-4"
                        >
                          <div className="space-y-4">
                            {country.entries.map((meta) => renderAchievementCard(meta))}
                          </div>
                        </CollapsibleSection>
                      )
                    })}
                  </div>
                </CollapsibleSection>
                {index < groups.length - 1 && (
                  <footer>
                    <hr className="border-t border-zinc-200 dark:border-[#18181b]" />
                  </footer>
                )}
              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

const UpdateLogPanel = ({
  state,
}: {
  state: UpdateLogState
}) => {
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-[#18181b] dark:text-zinc-400">
        <div className="inline-flex items-center gap-2">
          <MdAutorenew className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Fetching the latest updates…</span>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        <div className="inline-flex items-center gap-2">
          <MdClose className="h-4 w-4" aria-hidden="true" />
          <span>Unable to load updates. Reload the page to try again.</span>
        </div>
      </div>
    )
  }

  if (state.status === 'success' && state.entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-[#18181b] dark:text-zinc-400">
        <div className="inline-flex items-center gap-2">
          <MdClose className="h-4 w-4" aria-hidden="true" />
          <span>No updates found.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {state.lastUpdated && (
        <p className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Last refreshed {formatUpdateDate(state.lastUpdated)}
        </p>
      )}
      {state.entries.map((entry) => (
        <article
          key={entry.sha}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-[#18181b] dark:bg-zinc-900"
        >
          <div className="space-y-1">
          <a
            href={entry.url}
            target="_blank"
            rel="noreferrer"
            className="text-base font-semibold text-[var(--accent-600)] underline decoration-[var(--accent-300)] underline-offset-4 transition hover:decoration-[var(--accent-400)] dark:text-[var(--accent-300)] dark:decoration-[var(--accent-400)] dark:hover:decoration-[var(--accent-300)]"
          >
            {entry.message}
          </a>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatUpdateDate(entry.date)}
            </p>
            <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
              {entry.sha.slice(0, 7)}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}

const EmptyState = () => (
  <div className="w-full rounded bg-[var(--accent-700)] px-12 py-6 text-white">
    <h3 className="mb-2 text-lg font-medium">No results!</h3>
    <p>
      <a href="https://github.com/kirklandwaterbot/metro-memory/pulls" className="underline">
        Want to play in your city? Open a pull request on Github.
      </a>
    </p>
  </div>
)

const MissingTabContent = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-[#18181b] dark:text-zinc-400">
    {message}
  </div>
)

const SuggestCity = () => (
  <p className="mt-6">
    Want the game in your city?{' '}
    <a
      className="font-medium text-[var(--accent-600)] underline decoration-[var(--accent-300)] underline-offset-4 transition hover:decoration-[var(--accent-400)] dark:text-[var(--accent-300)] dark:decoration-[var(--accent-400)] dark:hover:decoration-[var(--accent-300)]"
      href="https://github.com/kirklandwaterbot/metro-memory/pulls"
      target="_blank"
      rel="noreferrer"
    >
      Create a pull request on GitHub
    </a>
    .
  </p>
)

const sortAchievementEntries = (
  entries: AchievementMeta[],
  sort: AchievementSortOption,
  unlockedSet: Set<string>,
  unlockedData?: Map<string, number>,
): AchievementMeta[] => {
  const compareName = (a: AchievementMeta, b: AchievementMeta) => a.title.localeCompare(b.title)
  const compareContinent = (a: AchievementMeta, b: AchievementMeta) => {
    const result = a.continent.localeCompare(b.continent)
    return result !== 0 ? result : compareName(a, b)
  }
  const base = [...entries]
  switch (sort) {
    case 'name-asc':
      return base.sort(compareName)
    case 'name-desc':
      return base.sort((a, b) => compareName(b, a))
    case 'continent-asc':
      return base.sort(compareContinent)
    case 'continent-desc':
      return base.sort((a, b) => compareContinent(b, a))
    case 'not-achieved-asc':
      return base.filter((entry) => !unlockedSet.has(entry.slug)).sort(compareName)
    case 'not-achieved-asc':
      return base.filter((entry) => !unlockedSet.has(entry.slug)).sort(compareName)
    case 'achieved-asc':
      if (unlockedData) {
        return base
          .filter((entry) => unlockedSet.has(entry.slug))
          .sort((a, b) => {
             const tA = unlockedData.get(a.slug) ?? 0
             const tB = unlockedData.get(b.slug) ?? 0
             return tB - tA // Descending time (most recent first) usually expected, or Ascending?
             // "Achieved in order" usually means chronological (oldest first) or stack (newest first).
             // Let's assume most recent first (descending) is generally preferred for "In Order" of timeline?
             // Or "In Order" meant "Chronological"? User said "Achieved in order"
             // I'll stick to DESCENDING time (Newest on top) which is standard for feeds.
             // Wait, "Achieved in order" -> could be 1st achieved, 2nd achieved... (ASC)
             // or Latest achieved.
             // The previous sort was "achieved-asc" (Name A-Z).
             // Let's do DESCENDING (Newest first) as it matches "Latest".
             // Actually, let's look at what the user likely wants.
             // "timestamps... make sure it aligns with timezone"
             // "Achieved in order" -> The order they achieved them.
             // Usually lists are newest first.
             // I will do Newest First (tB - tA).
          })
      }
      return base.filter((entry) => unlockedSet.has(entry.slug)).sort(compareName)
    case 'default':
    default:
      return base.sort(compareName)
  }
}

const formatUpdateDate = (iso?: string) => {
  if (!iso) {
    return 'Unknown date'
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default SearcheableCitiesList
