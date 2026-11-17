import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('dublin', {
  icons: {
    icon: '/api/city-icon/dublin',
    apple: '/api/city-icon/dublin',
  },
  title: 'Dublin Metro Memory',
  description: 'How many DART, Luas and Dublin commuter rail stations can you name from memory?',
  openGraph: {
    title: 'Dublin Metro Memory',
    description: 'How many DART, Luas and Dublin commuter rail stations can you name from memory?',
    type: 'website',
    locale: 'en_IE',
    url: 'https://metro-memory.xyz/europe/ireland/dublin',
  },
})
