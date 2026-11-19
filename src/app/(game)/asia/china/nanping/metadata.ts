import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('nanping', {
  icons: {
    icon: '/api/city-icon/nanping',
    apple: '/api/city-icon/nanping',
  },
  title: 'Wuyishan Tram Metro Memory',
  description: 'How many of the Wuyishan tram stops can you name from memory?',
  openGraph: {
    title: 'Wuyishan Tram Metro Memory',
    description: 'How many of the Wuyishan tram stops can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/nanping',
  },
})
