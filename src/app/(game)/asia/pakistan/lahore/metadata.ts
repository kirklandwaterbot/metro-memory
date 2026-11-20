import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lahore', {
  icons: {
    icon: '/api/city-icon/lahore',
    apple: '/api/city-icon/lahore',
  },
  title: 'Lahore Metro Memory',
  description: 'How many Lahore Metro stations can you name from memory?',
  openGraph: {
    title: 'Lahore Metro Memory',
    description: 'How many Lahore Metro stations can you name from memory?',
    type: 'website',
    locale: 'ur_PK',
    url: 'https://metro-memory.xyz/asia/pakistan/lahore',
  },
})
