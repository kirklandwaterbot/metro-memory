import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('huangshi', {
  icons: {
    icon: '/api/city-icon/huangshi',
    apple: '/api/city-icon/huangshi',
  },
  title: 'Huangshi Metro Memory',
  description: 'How many of the Huangshi rail transit stations can you name from memory?',
  openGraph: {
    title: 'Huangshi Metro Memory',
    description: 'How many of the Huangshi rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/huangshi',
  },
})
