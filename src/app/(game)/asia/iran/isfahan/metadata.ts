import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('isfahan', {
  icons: {
    icon: '/api/city-icon/isfahan',
    apple: '/api/city-icon/isfahan',
  },
  title: 'Isfahan Metro Memory',
  description: 'How many Isfahan Metro stations can you name from memory?',
  openGraph: {
    title: 'Isfahan Metro Memory',
    description: 'How many Isfahan Metro stations can you name from memory?',
    type: 'website',
    locale: 'fa_IR',
    url: 'https://metro-memory.xyz/asia/iran/isfahan',
  },
})
