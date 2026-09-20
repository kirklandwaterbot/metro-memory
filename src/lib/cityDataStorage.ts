import 'server-only'

import { readFile } from 'fs/promises'
import path from 'path'

const assetBaseUrl = process.env.METRO_ASSET_BASE_URL?.trim().replace(/\/+$/, '')

export const readCityDataJson = async <T>(slug: string): Promise<T> => {
  if (assetBaseUrl) {
    const response = await fetch(
      `${assetBaseUrl}/city-data/${encodeURIComponent(slug)}.json`,
      { cache: 'no-store' },
    )
    if (!response.ok) {
      throw new Error(`Unable to load city data for ${slug}: ${response.status}`)
    }
    return (await response.json()) as T
  }

  const filePath = path.join(process.cwd(), 'public', 'city-data', `${slug}.json`)
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}
