import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('adana', {
  icons: {
    icon: '/api/city-icon/adana',
    apple: '/api/city-icon/adana',
  },
  title: 'Adana Metro Memory',
  description: 'How many Adana Metro stations can you name from memory?',
  openGraph: {
    title: 'Adana Metro Memory',
    description: 'How many Adana Metro stations can you name from memory?',
    type: 'website',
    locale: 'tr_TR',
    url: 'https://metro-memory.xyz/europe/turkey/adana',
  },
})
