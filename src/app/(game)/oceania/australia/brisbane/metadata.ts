import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('brisbane', {
  icons: {
    icon: '/api/city-icon/brisbane',
    apple: '/api/city-icon/brisbane',
  },
  title: 'Brisbane Metro Memory',
  description: 'How many Queensland Rail Citytrain stations can you name from memory?',
  openGraph: {
    title: 'Brisbane Metro Memory',
    description: 'How many Queensland Rail Citytrain stations can you name from memory?',
    type: 'website',
    locale: 'en_AU',
    url: 'https://metro-memory.xyz/oceania/australia/brisbane',
  },
})
