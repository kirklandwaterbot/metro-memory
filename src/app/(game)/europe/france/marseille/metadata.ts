import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('marseille', {
  icons: {
    icon: '/api/city-icon/marseille',
    apple: '/api/city-icon/marseille',
  },
  title: 'Marseille Metro Memory',
  description: 'How many Marseille Metro stations can you name from memory?',
  openGraph: {
    title: 'Marseille Metro Memory',
    description: 'How many Marseille Metro stations can you name from memory?',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.xyz/europe/france/marseille',
  },
})
