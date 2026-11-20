import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('turin', {
  icons: {
    icon: '/api/city-icon/turin',
    apple: '/api/city-icon/turin',
  },
  title: 'Turin Metro Memory',
  description: 'How many Turin Metro stations can you name from memory?',
  openGraph: {
    title: 'Turin Metro Memory',
    description: 'How many Turin Metro stations can you name from memory?',
    type: 'website',
    locale: 'it_IT',
    url: 'https://metro-memory.xyz/europe/italy/turin',
  },
})
