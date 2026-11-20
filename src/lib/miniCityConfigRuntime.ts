import type { Config } from './types'
import { loadCityConfig } from './cityConfigRuntime'

export const loadMiniCityParentConfig = async (
  parentSlug: string,
): Promise<Config | null> => {
  switch (parentSlug) {
    case 'gba': {
      const configModule = await import('@/app/(game)/asia/china/gba/config')
      return configModule.default
    }
    case 'chicago': {
      const configModule =
        await import('@/app/(game)/north-america/usa/chicago/config')
      return configModule.default
    }
    case 'california-state': {
      const configModule =
        await import('@/app/(game)/north-america/usa/california-state/config')
      return configModule.default
    }
    case 'nyc': {
      const configModule =
        await import('@/app/(game)/north-america/usa/nyc/config')
      return configModule.default
    }
    case 'boston': {
      const configModule =
        await import('@/app/(game)/north-america/usa/boston/config')
      return configModule.default
    }
    case 'florida-state': {
      const configModule =
        await import('@/app/(game)/north-america/usa/florida-state/config')
      return configModule.default
    }
    case 'montreal': {
      const configModule =
        await import('@/app/(game)/north-america/canada/montreal/config')
      return configModule.default
    }
    case 'philly': {
      const configModule =
        await import('@/app/(game)/north-america/usa/philly/config')
      return configModule.default
    }
    case 'toronto-waterloo': {
      const configModule =
        await import('@/app/(game)/north-america/canada/toronto-waterloo/config')
      return configModule.default
    }
    case 'dc': {
      const configModule =
        await import('@/app/(game)/north-america/usa/dc/config')
      return configModule.default
    }
    default:
      // every other parent city loads through the generic city config loader
      return loadCityConfig(parentSlug).catch(() => null)
  }
}
