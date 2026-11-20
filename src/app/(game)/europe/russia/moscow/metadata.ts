import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('moscow', {
  icons: {
    icon: '/api/city-icon/moscow',
    apple: '/api/city-icon/moscow',
  },
  title: 'Moscow Metro Memory',
  description: 'How many Moscow Metro, MCC and MCD stations can you name from memory?',
  openGraph: {
    title: 'Moscow Metro Memory',
    description: 'How many Moscow Metro, MCC and MCD stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/europe/russia/moscow',
  },
})
