import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('hefei', {
  icons: {
    icon: '/api/city-icon/hefei',
    apple: '/api/city-icon/hefei',
  },
  title: 'Hefei Metro Memory',
  description: 'How many of the Hefei rail transit stations can you name from memory?',
  openGraph: {
    title: 'Hefei Metro Memory',
    description: 'How many of the Hefei rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/hefei',
  },
})
