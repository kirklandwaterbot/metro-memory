import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('mecca', {
  icons: {
    icon: '/api/city-icon/mecca',
    apple: '/api/city-icon/mecca',
  },
  title: 'Mecca Metro Memory',
  description: 'How many Mecca Metro stations can you name from memory?',
  openGraph: {
    title: 'Mecca Metro Memory',
    description: 'How many Mecca Metro stations can you name from memory?',
    type: 'website',
    locale: 'ar_SA',
    url: 'https://metro-memory.xyz/asia/saudi-arabia/mecca',
  },
})
