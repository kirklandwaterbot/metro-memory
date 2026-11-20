import { Config, Line } from '@/lib/types'
import type { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const LINES: {
  [name: string]: Line
} = {
  "METRO 6": { name: "Line 6", color: "#6eca97", backgroundColor: "#3e9a67", textColor: "#fff", order: 6, icon: "ParisLine6.svg" },
  "METRO 8": { name: "Line 8", color: "#d282be", backgroundColor: "#a2528e", textColor: "#fff", order: 8, icon: "ParisLine8.svg" },
  "METRO 1": { name: "Line 1", color: "#ffbe00", backgroundColor: "#cf8e00", textColor: "#000", order: 1, icon: "ParisLine1.svg" },
  "METRO 14": { name: "Line 14", color: "#62259d", backgroundColor: "#32056d", textColor: "#fff", order: 14, icon: "ParisLine14.svg" },
  "METRO 9": { name: "Line 9", color: "#b6bd00", backgroundColor: "#868d00", textColor: "#fff", order: 9, icon: "ParisLine9.svg" },
  "METRO 10": { name: "Line 10", color: "#c9910d", backgroundColor: "#996100", textColor: "#fff", order: 10, icon: "ParisLine10.svg" },
  "METRO 13": { name: "Line 13", color: "#6ec4e8", backgroundColor: "#3eb4b8", textColor: "#fff", order: 13, icon: "ParisLine13.svg" },
  "METRO 2": { name: "Line 2", color: "#0055c8", backgroundColor: "#002598", textColor: "#fff", order: 2, icon: "ParisLine2.svg" },
  "METRO 12": { name: "Line 12", color: "#007852", backgroundColor: "#004822", textColor: "#fff", order: 12, icon: "ParisLine12.svg" },
  "METRO 5": { name: "Line 5", color: "#ff7e2e", backgroundColor: "#cf4e00", textColor: "#fff", order: 5, icon: "ParisLine5.svg" },
  "METRO 7": { name: "Line 7", color: "#fa9aba", backgroundColor: "#ca6a8a", textColor: "#fff", order: 7, icon: "ParisLine7.svg" },
  "METRO 3bis": { name: "Line 3bis", color: "#6ec4e8", backgroundColor: "#3eb4b8", textColor: "#fff", order: 3.5, icon: "ParisLine3bis.svg" },
  "METRO 3": { name: "Line 3", color: "#6e6e00", backgroundColor: "#3e3e00", textColor: "#fff", order: 3, icon: "ParisLine3.svg" },
  "METRO 4": { name: "Line 4", color: "#a0006e", backgroundColor: "#70003e", textColor: "#fff", order: 4, icon: "ParisLine4.svg" },
  "METRO 7bis": { name: "Line 7bis", color: "#6eca97", backgroundColor: "#3e9a67", textColor: "#fff", order: 7.5, icon: "ParisLine7bis.svg" },
  "METRO 11": { name: "Line 11", color: "#704b1c", backgroundColor: "#401b00", textColor: "#fff", order: 11, icon: "ParisLine11.svg" }
}

export const METADATA: Metadata = {
  icons: {
    icon: '/api/city-icon/paris',
    apple: '/api/city-icon/paris',
  },
  title: 'Paris Métro Memory Game',
  description: 'How many of the Paris Métro stations can you name from memory?',
  openGraph: {
    title: 'Paris Métro Memory Game',
    description:
      'How many of the Paris Métro stations can you name from memory?',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.xyz/europe/france/paris',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  bounds: [
    [2.22, 48.81],
    [2.42, 48.91],
  ],
  maxBounds: [
    [2.0, 48.6],
    [2.7, 49.1],
  ],
  minZoom: 10,
  fadeDuration: 50,
}

export const CITY_NAME = 'paris'

export const LOCALE = 'fr'

export const GAUGE_COLORS = 'inverted'

export const MAP_FROM_DATA = true

const config: Config = {
  GAUGE_COLORS,
  MAP_FROM_DATA,
  LOCALE,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
}

export default config
