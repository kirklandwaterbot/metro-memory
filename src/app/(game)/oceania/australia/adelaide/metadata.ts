import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('adelaide', {
  icons: {
    icon: '/api/city-icon/adelaide',
    apple: '/api/city-icon/adelaide',
  },
  title: 'Adelaide Metro Memory',
  description: 'How many Adelaide Metro train and tram stops can you name from memory?',
  openGraph: {
    title: 'Adelaide Metro Memory',
    description: 'How many Adelaide Metro train and tram stops can you name from memory?',
    type: 'website',
    locale: 'en_AU',
    url: 'https://metro-memory.xyz/oceania/australia/adelaide',
  },
})
