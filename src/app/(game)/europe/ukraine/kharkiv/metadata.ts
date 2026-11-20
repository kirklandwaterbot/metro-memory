import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kharkiv', {
  icons: {
    icon: '/api/city-icon/kharkiv',
    apple: '/api/city-icon/kharkiv',
  },
  title: 'Kharkiv Metro Memory',
  description: 'How many Kharkiv Metro stations can you name from memory?',
  openGraph: {
    title: 'Kharkiv Metro Memory',
    description: 'How many Kharkiv Metro stations can you name from memory?',
    type: 'website',
    locale: 'uk_UA',
    url: 'https://metro-memory.xyz/europe/ukraine/kharkiv',
  },
})
