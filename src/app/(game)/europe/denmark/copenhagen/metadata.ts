import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('copenhagen', {
  icons: {
    icon: '/api/city-icon/copenhagen',
    apple: '/api/city-icon/copenhagen',
  },
  title: 'Copenhagen Metro Memory',
  description: 'How many Copenhagen Metro stations can you name from memory?',
  openGraph: {
    title: 'Copenhagen Metro Memory',
    description: 'How many Copenhagen Metro stations can you name from memory?',
    type: 'website',
    locale: 'da_DK',
    url: 'https://metro-memory.xyz/europe/denmark/copenhagen',
  },
})
