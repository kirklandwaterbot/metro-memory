import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('helsinki', {
  icons: {
    icon: '/api/city-icon/helsinki',
    apple: '/api/city-icon/helsinki',
  },
  title: 'Helsinki Metro Memory',
  description: 'How many Helsinki Metro stations can you name from memory?',
  openGraph: {
    title: 'Helsinki Metro Memory',
    description: 'How many Helsinki Metro stations can you name from memory?',
    type: 'website',
    locale: 'fi_FI',
    url: 'https://metro-memory.xyz/europe/finland/helsinki',
  },
})
