import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('jakarta-krl', {
  icons: {
    icon: '/api/city-icon/jakarta-krl',
    apple: '/api/city-icon/jakarta-krl',
  },
  title: 'x',
  description: 'x',
  openGraph: {
    title: 'x',
    description: 'x',
    type: 'website',
    locale: 'id_ID',
    url: 'https://metro-memory.xyz/../../../data-sources/extras/jakarta-krl',
  },
})
