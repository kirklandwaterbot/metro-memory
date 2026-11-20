import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tashkent', {
  icons: {
    icon: '/api/city-icon/tashkent',
    apple: '/api/city-icon/tashkent',
  },
  title: 'Tashkent Metro Memory',
  description: 'How many Tashkent Metro stations can you name from memory?',
  openGraph: {
    title: 'Tashkent Metro Memory',
    description: 'How many Tashkent Metro stations can you name from memory?',
    type: 'website',
    locale: 'uz_UZ',
    url: 'https://metro-memory.xyz/asia/uzbekistan/tashkent',
  },
})
