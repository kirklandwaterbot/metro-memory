import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('komuter-utara', {
  icons: {
    icon: '/api/city-icon/komuter-utara',
    apple: '/api/city-icon/komuter-utara',
  },
  title: 'KTM Komuter Northern Memory',
  description: 'How many KTM Komuter Northern Sector stations can you name from memory?',
  openGraph: {
    title: 'KTM Komuter Northern Memory',
    description: 'How many KTM Komuter Northern Sector stations can you name from memory?',
    type: 'website',
    locale: 'ms_MY',
    url: 'https://metro-memory.xyz/asia/malaysia/komuter-utara',
  },
})
