import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('agra', {
  icons: {
    icon: '/api/city-icon/agra',
    apple: '/api/city-icon/agra',
  },
  title: 'Agra Metro Memory',
  description: 'How many Agra Metro stations can you name from memory?',
  openGraph: {
    title: 'Agra Metro Memory',
    description: 'How many Agra Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/agra',
  },
})
