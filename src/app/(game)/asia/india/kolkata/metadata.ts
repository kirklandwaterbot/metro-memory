import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kolkata', {
  icons: {
    icon: '/api/city-icon/kolkata',
    apple: '/api/city-icon/kolkata',
  },
  title: 'Kolkata Metro Memory',
  description: 'How many Kolkata Metro stations can you name from memory?',
  openGraph: {
    title: 'Kolkata Metro Memory',
    description: 'How many Kolkata Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/kolkata',
  },
})
