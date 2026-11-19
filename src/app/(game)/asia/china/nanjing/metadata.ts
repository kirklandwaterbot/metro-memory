import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('nanjing', {
  icons: {
    icon: '/api/city-icon/nanjing',
    apple: '/api/city-icon/nanjing',
  },
  title: 'Nanjing Metro Memory',
  description: 'How many of the Nanjing rail transit stations can you name from memory?',
  openGraph: {
    title: 'Nanjing Metro Memory',
    description: 'How many of the Nanjing rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/nanjing',
  },
})
