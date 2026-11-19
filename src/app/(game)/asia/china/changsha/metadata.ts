import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('changsha', {
  icons: {
    icon: '/api/city-icon/changsha',
    apple: '/api/city-icon/changsha',
  },
  title: 'Changsha Metro Memory',
  description: 'How many of the Changsha rail transit stations can you name from memory?',
  openGraph: {
    title: 'Changsha Metro Memory',
    description: 'How many of the Changsha rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/changsha',
  },
})
