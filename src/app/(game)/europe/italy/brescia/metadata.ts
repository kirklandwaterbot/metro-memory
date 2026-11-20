import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('brescia', {
  icons: {
    icon: '/api/city-icon/brescia',
    apple: '/api/city-icon/brescia',
  },
  title: 'Brescia Metro Memory',
  description: 'How many Brescia Metro stations can you name from memory?',
  openGraph: {
    title: 'Brescia Metro Memory',
    description: 'How many Brescia Metro stations can you name from memory?',
    type: 'website',
    locale: 'it_IT',
    url: 'https://metro-memory.xyz/europe/italy/brescia',
  },
})
