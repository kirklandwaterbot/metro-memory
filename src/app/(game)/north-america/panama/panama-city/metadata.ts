import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('panama-city', {
  icons: {
    icon: '/api/city-icon/panama-city',
    apple: '/api/city-icon/panama-city',
  },
  title: 'Panama Metro Memory',
  description: 'How many Panama Metro stations can you name from memory?',
  openGraph: {
    title: 'Panama Metro Memory',
    description: 'How many Panama Metro stations can you name from memory?',
    type: 'website',
    locale: 'es_PA',
    url: 'https://metro-memory.xyz/north-america/panama/panama-city',
  },
})
