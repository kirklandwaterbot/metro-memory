import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('hangzhou', {
  icons: {
    icon: '/api/city-icon/hangzhou',
    apple: '/api/city-icon/hangzhou',
  },
  title: 'Hangzhou & Shaoxing Metro Memory',
  description: 'How many of the Hangzhou and Shaoxing metro stations can you name from memory?',
  openGraph: {
    title: 'Hangzhou & Shaoxing Metro Memory',
    description: 'How many of the Hangzhou and Shaoxing metro stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/hangzhou',
  },
})
