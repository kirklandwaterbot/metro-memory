import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('astana', {
  icons: {
    icon: '/api/city-icon/astana',
    apple: '/api/city-icon/astana',
  },
  title: 'Astana Light Metro Memory',
  description: 'How many Astana Light Metro stations can you name from memory?',
  openGraph: {
    title: 'Astana Light Metro Memory',
    description: 'How many Astana Light Metro stations can you name from memory?',
    type: 'website',
    locale: 'kk_KZ',
    url: 'https://metro-memory.xyz/asia/kazakhstan/astana',
  },
})
