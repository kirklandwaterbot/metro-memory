export const UNAVAILABLE_CITY_ACCESS_EVENT = 'metro-unavailable-city-access-change'
export const PREVIEW_UNLOCKABLE_CITY_SLUGS = new Set<string>([])

const ACCESS_KEY = 'global-unavailable-city-access-granted'

const isBrowser = () => typeof window !== 'undefined'

export const readUnavailableCityAccess = () => {
  if (!isBrowser()) return false
  return window.localStorage.getItem(ACCESS_KEY) === 'true'
}

export const writeUnavailableCityAccess = (granted: boolean) => {
  if (!isBrowser()) return

  if (granted) {
    window.localStorage.setItem(ACCESS_KEY, 'true')
  } else {
    window.localStorage.removeItem(ACCESS_KEY)
  }

  window.dispatchEvent(new Event(UNAVAILABLE_CITY_ACCESS_EVENT))
}

export const isPreviewUnlockableCity = (slug: string | null | undefined) =>
  typeof slug === 'string' && PREVIEW_UNLOCKABLE_CITY_SLUGS.has(slug)