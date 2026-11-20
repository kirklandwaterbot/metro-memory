import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('athens', {
  icons: {
    icon: '/api/city-icon/athens',
    apple: '/api/city-icon/athens',
  },
  title: 'Athens Metro Memory',
  description: 'How many Athens Metro stations can you name from memory?',
  openGraph: {
    title: 'Athens Metro Memory',
    description: 'How many Athens Metro stations can you name from memory?',
    type: 'website',
    locale: 'el_GR',
    url: 'https://metro-memory.xyz/europe/greece/athens',
  },
})
