import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('wellington', {
  icons: {
    icon: '/api/city-icon/wellington',
    apple: '/api/city-icon/wellington',
  },
  title: 'Wellington Metro Memory',
  description: 'How many Metlink train stations can you name from memory?',
  openGraph: {
    title: 'Wellington Metro Memory',
    description: 'How many Metlink train stations can you name from memory?',
    type: 'website',
    locale: 'en_NZ',
    url: 'https://metro-memory.xyz/oceania/new-zealand/wellington',
  },
})
