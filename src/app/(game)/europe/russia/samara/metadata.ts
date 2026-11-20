import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('samara', {
  icons: {
    icon: '/api/city-icon/samara',
    apple: '/api/city-icon/samara',
  },
  title: 'Samara Metro Memory',
  description: 'How many Samara Metro stations can you name from memory?',
  openGraph: {
    title: 'Samara Metro Memory',
    description: 'How many Samara Metro stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/europe/russia/samara',
  },
})
