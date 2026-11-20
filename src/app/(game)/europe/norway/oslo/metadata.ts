import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('oslo', {
  icons: {
    icon: '/api/city-icon/oslo',
    apple: '/api/city-icon/oslo',
  },
  title: 'Oslo Metro Memory',
  description: 'How many Oslo Metro stations can you name from memory?',
  openGraph: {
    title: 'Oslo Metro Memory',
    description: 'How many Oslo Metro stations can you name from memory?',
    type: 'website',
    locale: 'nb_NO',
    url: 'https://metro-memory.xyz/europe/norway/oslo',
  },
})
