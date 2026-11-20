import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('korean-state-railway', {
  icons: {
    icon: '/api/city-icon/korean-state-railway',
    apple: '/api/city-icon/korean-state-railway',
  },
  title: 'Korean State Railway Memory',
  description: 'How many Korean State Railway stations can you name from memory?',
  openGraph: {
    title: 'Korean State Railway Memory',
    description: 'How many Korean State Railway stations can you name from memory?',
    type: 'website',
    locale: 'ko_KP',
    url: 'https://metro-memory.xyz/asia/north-korea/korean-state-railway',
  },
})
