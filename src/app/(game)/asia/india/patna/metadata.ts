import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('patna', {
  icons: {
    icon: '/api/city-icon/patna',
    apple: '/api/city-icon/patna',
  },
  title: 'Patna Metro Memory',
  description: 'How many Patna Metro stations can you name from memory?',
  openGraph: {
    title: 'Patna Metro Memory',
    description: 'How many Patna Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/patna',
  },
})
