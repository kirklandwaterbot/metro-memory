import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('perth', {
  icons: {
    icon: '/api/city-icon/perth',
    apple: '/api/city-icon/perth',
  },
  title: 'Perth Metro Memory',
  description: 'How many Transperth train stations can you name from memory?',
  openGraph: {
    title: 'Perth Metro Memory',
    description: 'How many Transperth train stations can you name from memory?',
    type: 'website',
    locale: 'en_AU',
    url: 'https://metro-memory.xyz/oceania/australia/perth',
  },
})
