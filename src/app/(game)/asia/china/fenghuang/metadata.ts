import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('fenghuang', {
  icons: {
    icon: '/api/city-icon/fenghuang',
    apple: '/api/city-icon/fenghuang',
  },
  title: 'Fenghuang Metro Memory',
  description: 'How many of the Fenghuang rail transit stations can you name from memory?',
  openGraph: {
    title: 'Fenghuang Metro Memory',
    description: 'How many of the Fenghuang rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/fenghuang',
  },
})
