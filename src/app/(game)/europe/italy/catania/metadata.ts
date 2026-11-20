import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('catania', {
  icons: {
    icon: '/api/city-icon/catania',
    apple: '/api/city-icon/catania',
  },
  title: 'Catania Metro Memory',
  description: 'How many Catania Metro stations can you name from memory?',
  openGraph: {
    title: 'Catania Metro Memory',
    description: 'How many Catania Metro stations can you name from memory?',
    type: 'website',
    locale: 'it_IT',
    url: 'https://metro-memory.xyz/europe/italy/catania',
  },
})
