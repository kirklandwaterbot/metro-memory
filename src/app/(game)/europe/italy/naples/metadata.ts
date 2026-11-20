import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('naples', {
  icons: {
    icon: '/api/city-icon/naples',
    apple: '/api/city-icon/naples',
  },
  title: 'Naples Metro Memory',
  description: 'How many Naples Metro stations can you name from memory?',
  openGraph: {
    title: 'Naples Metro Memory',
    description: 'How many Naples Metro stations can you name from memory?',
    type: 'website',
    locale: 'it_IT',
    url: 'https://metro-memory.xyz/europe/italy/naples',
  },
})
