import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('auckland', {
  icons: {
    icon: '/api/city-icon/auckland',
    apple: '/api/city-icon/auckland',
  },
  title: 'Auckland Metro Memory',
  description: 'How many Auckland train stations can you name from memory?',
  openGraph: {
    title: 'Auckland Metro Memory',
    description: 'How many Auckland train stations can you name from memory?',
    type: 'website',
    locale: 'en_NZ',
    url: 'https://metro-memory.xyz/oceania/new-zealand/auckland',
  },
})
