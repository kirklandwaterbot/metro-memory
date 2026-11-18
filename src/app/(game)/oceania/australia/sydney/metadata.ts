import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('sydney', {
  icons: {
    icon: '/api/city-icon/sydney',
    apple: '/api/city-icon/sydney',
  },
  title: 'Sydney Metro Memory',
  description: 'How many Sydney Trains, Metro and Light Rail stations can you name from memory?',
  openGraph: {
    title: 'Sydney Metro Memory',
    description: 'How many Sydney Trains, Metro and Light Rail stations can you name from memory?',
    type: 'website',
    locale: 'en_AU',
    url: 'https://metro-memory.xyz/oceania/australia/sydney',
  },
})
