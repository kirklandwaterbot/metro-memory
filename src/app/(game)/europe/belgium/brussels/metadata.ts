import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('brussels', {
  icons: {
    icon: '/api/city-icon/brussels',
    apple: '/api/city-icon/brussels',
  },
  title: 'Brussels Metro Memory',
  description: 'How many Brussels Metro stations can you name from memory?',
  openGraph: {
    title: 'Brussels Metro Memory',
    description: 'How many Brussels Metro stations can you name from memory?',
    type: 'website',
    locale: 'fr_BE',
    url: 'https://metro-memory.xyz/europe/belgium/brussels',
  },
})
