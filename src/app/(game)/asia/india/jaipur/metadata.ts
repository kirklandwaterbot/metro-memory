import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('jaipur', {
  icons: {
    icon: '/api/city-icon/jaipur',
    apple: '/api/city-icon/jaipur',
  },
  title: 'Jaipur Metro Memory',
  description: 'How many Jaipur Metro stations can you name from memory?',
  openGraph: {
    title: 'Jaipur Metro Memory',
    description: 'How many Jaipur Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/jaipur',
  },
})
