import { FeatureCollection, LineString, MultiLineString, Point } from 'geojson'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export type SortOptionType = 'order' | 'name' | 'name-desc' | 'line'

export type DataFeatureCollection = FeatureCollection<
  LineString | MultiLineString | Point,
  {
    name: string
    id?: number | null
    long_name?: string
    short_name?: string
    line?: string
    alternate_names?: string[]
    display_name?: string
    cluster_key?: number | string
  }
>

export type RoutesFeatureCollection = FeatureCollection<
  LineString | MultiLineString,
  {
    color: string
    line?: string
    name?: string
    order?: number
  }
>

export type DataFeature = DataFeatureCollection['features'][number]

export interface SortOption {
  name: string
  id: SortOptionType
  shortName: React.ReactNode
}

export interface Line {
  name: string
  color: string
  backgroundColor: string
  textColor: string
  badgeShape?: 'circle' | 'capsule' | 'square' | 'wide' | 'diamond'
  badgeFit?: 'contain' | 'cover'
  badgeAspectRatio?: number
  progressOutlineColor?: string
  statsColor?: string
  order: number
  icon?: string
}

export interface MapRenderCullingConfig {
  enabled: boolean
  paddingFactor?: number
}

export interface LineGroupLinesItem {
  type: 'lines'
  title?: string
  titleImage?: string
  lines: string[]
}

export interface LineGroupSeparatorItem {
  type: 'separator'
}

export type LineGroupItem = LineGroupLinesItem | LineGroupSeparatorItem

export interface LineGroup {
  title?: string
  titleImage?: string
  items: LineGroupItem[]
}

export interface Config {
  MAP_FROM_DATA?: boolean
  MAP_RENDER_CULLING?: MapRenderCullingConfig
  GAUGE_COLORS?: 'inverted' | 'default'
  LOCALE: string
  CITY_NAME: string
  ASSET_BASE_PATH?: string
  MAP_CONFIG: MapboxOptions
  METADATA: Metadata
  LINES: { [key: string]: Line }
  LINE_GROUPS?: LineGroup[]
}
