import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('delhi', {
  icons: {
    icon: '/api/city-icon/delhi',
    apple: '/api/city-icon/delhi',
  },
  title: 'Delhi Metro Memory',
  description: 'How many Delhi Metro stations can you name from memory?',
  openGraph: {
    title: 'Delhi Metro Memory',
    description: 'How many Delhi Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/delhi',
  },
})
