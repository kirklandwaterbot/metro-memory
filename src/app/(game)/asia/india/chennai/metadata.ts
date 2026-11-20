import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('chennai', {
  icons: {
    icon: '/api/city-icon/chennai',
    apple: '/api/city-icon/chennai',
  },
  title: 'Chennai Metro Memory',
  description: 'How many Chennai Metro stations can you name from memory?',
  openGraph: {
    title: 'Chennai Metro Memory',
    description: 'How many Chennai Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/chennai',
  },
})
