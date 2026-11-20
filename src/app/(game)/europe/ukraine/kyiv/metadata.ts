import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kyiv', {
  icons: {
    icon: '/api/city-icon/kyiv',
    apple: '/api/city-icon/kyiv',
  },
  title: 'Kyiv Metro Memory',
  description: 'How many Kyiv Metro stations can you name from memory?',
  openGraph: {
    title: 'Kyiv Metro Memory',
    description: 'How many Kyiv Metro stations can you name from memory?',
    type: 'website',
    locale: 'uk_UA',
    url: 'https://metro-memory.xyz/europe/ukraine/kyiv',
  },
})
