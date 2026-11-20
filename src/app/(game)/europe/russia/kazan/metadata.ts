import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kazan', {
  icons: {
    icon: '/api/city-icon/kazan',
    apple: '/api/city-icon/kazan',
  },
  title: 'Kazan Metro Memory',
  description: 'How many Kazan Metro stations can you name from memory?',
  openGraph: {
    title: 'Kazan Metro Memory',
    description: 'How many Kazan Metro stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/europe/russia/kazan',
  },
})
