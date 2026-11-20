import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('valencia', {
  icons: {
    icon: '/api/city-icon/valencia',
    apple: '/api/city-icon/valencia',
  },
  title: 'Valencia Metro Memory',
  description: 'How many Metro de Valencia stations can you name from memory?',
  openGraph: {
    title: 'Valencia Metro Memory',
    description: 'How many Metro de Valencia stations can you name from memory?',
    type: 'website',
    locale: 'es_VE',
    url: 'https://metro-memory.xyz/south-america/venezuela/valencia',
  },
})
