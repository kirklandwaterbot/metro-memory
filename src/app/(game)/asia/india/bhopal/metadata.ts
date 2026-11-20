import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('bhopal', {
  icons: {
    icon: '/api/city-icon/bhopal',
    apple: '/api/city-icon/bhopal',
  },
  title: 'Bhopal Metro Memory',
  description: 'How many Bhopal Metro stations can you name from memory?',
  openGraph: {
    title: 'Bhopal Metro Memory',
    description: 'How many Bhopal Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/bhopal',
  },
})
