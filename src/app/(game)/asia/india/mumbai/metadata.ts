import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('mumbai', {
  icons: {
    icon: '/api/city-icon/mumbai',
    apple: '/api/city-icon/mumbai',
  },
  title: 'Mumbai Metro Memory',
  description: 'How many Mumbai Metro stations can you name from memory?',
  openGraph: {
    title: 'Mumbai Metro Memory',
    description: 'How many Mumbai Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/mumbai',
  },
})
