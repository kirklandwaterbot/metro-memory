import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('riyadh', {
  icons: {
    icon: '/api/city-icon/riyadh',
    apple: '/api/city-icon/riyadh',
  },
  title: 'Riyadh Metro Memory',
  description: 'How many Riyadh Metro stations can you name from memory?',
  openGraph: {
    title: 'Riyadh Metro Memory',
    description: 'How many Riyadh Metro stations can you name from memory?',
    type: 'website',
    locale: 'ar_SA',
    url: 'https://metro-memory.xyz/asia/saudi-arabia/riyadh',
  },
})
