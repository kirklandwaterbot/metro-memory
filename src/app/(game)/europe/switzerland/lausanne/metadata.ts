import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lausanne', {
  icons: {
    icon: '/api/city-icon/lausanne',
    apple: '/api/city-icon/lausanne',
  },
  title: 'Lausanne Metro Memory',
  description: 'How many Lausanne Metro stations can you name from memory?',
  openGraph: {
    title: 'Lausanne Metro Memory',
    description: 'How many Lausanne Metro stations can you name from memory?',
    type: 'website',
    locale: 'fr_CH',
    url: 'https://metro-memory.xyz/europe/switzerland/lausanne',
  },
})
