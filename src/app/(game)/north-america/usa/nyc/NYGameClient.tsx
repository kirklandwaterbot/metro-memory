'use client'

import { useEffect, useMemo, useState } from 'react'

import GamePage from '@/components/GamePage'
import { DataFeatureCollection, RoutesFeatureCollection } from '@/lib/types'

import config from './config'

const NY_FEATURES_URL = '/city-data/nyc-features.json'
const NY_ROUTES_URL = '/city-data/nyc-routes.json'

const buildFeatureCollection = (data: DataFeatureCollection) => {
  return {
    ...data,
    features: data.features.filter((feature) =>
      feature?.properties?.line ? Boolean(config.LINES[feature.properties.line]) : false,
    ),
  } as DataFeatureCollection
}

const buildRoutesCollection = (data: RoutesFeatureCollection) => {
  return {
    ...data,
    features: data.features.filter((feature) => {
      const line = feature.properties?.line
      return line ? Boolean(config.LINES[line]) : false
    }),
  } as RoutesFeatureCollection
}

export default function NYGameClient() {
  const [fc, setFc] = useState<DataFeatureCollection | null>(null)
  const [routes, setRoutes] = useState<RoutesFeatureCollection | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [featuresRes, routesRes] = await Promise.all([
          fetch(NY_FEATURES_URL),
          fetch(NY_ROUTES_URL),
        ])

        if (!featuresRes.ok || !routesRes.ok) {
          throw new Error('Unable to load New York data.')
        }

        const [featuresJson, routesJson] = await Promise.all([
          featuresRes.json(),
          routesRes.json(),
        ])

        if (!active) return
        setFc(buildFeatureCollection(featuresJson))
        setRoutes(buildRoutesCollection(routesJson))
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load New York data.')
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const content = useMemo(() => {
    if (error) {
      return <div className="px-4 py-6 text-sm text-red-600">{error}</div>
    }

    if (!fc || !routes) {
      return null
    }

    return <GamePage fc={fc} routes={routes} />
  }, [error, fc, routes])

  return content
}
