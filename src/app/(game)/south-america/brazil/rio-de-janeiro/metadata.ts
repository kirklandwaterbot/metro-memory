import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('rio-de-janeiro', {
  icons: {
    icon: '/api/city-icon/rio-de-janeiro',
    apple: '/api/city-icon/rio-de-janeiro',
  },
  title: 'Rio de Janeiro Metro Memory',
  description: 'How many MetrôRio stations can you name from memory?',
  openGraph: {
    title: 'Rio de Janeiro Metro Memory',
    description: 'How many MetrôRio stations can you name from memory?',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://metro-memory.xyz/south-america/brazil/rio-de-janeiro',
  },
})
