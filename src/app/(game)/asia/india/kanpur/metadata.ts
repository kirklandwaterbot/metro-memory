import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kanpur', {
  icons: {
    icon: '/api/city-icon/kanpur',
    apple: '/api/city-icon/kanpur',
  },
  title: 'Kanpur Metro Memory',
  description: 'How many Kanpur Metro stations can you name from memory?',
  openGraph: {
    title: 'Kanpur Metro Memory',
    description: 'How many Kanpur Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/kanpur',
  },
})
