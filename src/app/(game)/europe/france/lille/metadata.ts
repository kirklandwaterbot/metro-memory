import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lille', {
  icons: {
    icon: '/api/city-icon/lille',
    apple: '/api/city-icon/lille',
  },
  title: 'Lille Metro Memory',
  description: 'How many Lille Metro stations can you name from memory?',
  openGraph: {
    title: 'Lille Metro Memory',
    description: 'How many Lille Metro stations can you name from memory?',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.xyz/europe/france/lille',
  },
})
