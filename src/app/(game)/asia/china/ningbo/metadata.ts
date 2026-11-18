import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('ningbo', {
  icons: {
    icon: '/api/city-icon/ningbo',
    apple: '/api/city-icon/ningbo',
  },
  title: 'Ningbo Metro Memory',
  description: 'How many of the Ningbo rail transit stations can you name from memory?',
  openGraph: {
    title: 'Ningbo Metro Memory',
    description: 'How many of the Ningbo rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/ningbo',
  },
})
