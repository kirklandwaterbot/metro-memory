import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('ankara', {
  icons: {
    icon: '/api/city-icon/ankara',
    apple: '/api/city-icon/ankara',
  },
  title: 'Ankara Metro Memory',
  description: 'How many Ankara Metro stations can you name from memory?',
  openGraph: {
    title: 'Ankara Metro Memory',
    description: 'How many Ankara Metro stations can you name from memory?',
    type: 'website',
    locale: 'tr_TR',
    url: 'https://metro-memory.xyz/europe/turkey/ankara',
  },
})
