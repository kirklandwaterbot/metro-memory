import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('ahmedabad', {
  icons: {
    icon: '/api/city-icon/ahmedabad',
    apple: '/api/city-icon/ahmedabad',
  },
  title: 'Ahmedabad Metro Memory',
  description: 'How many Ahmedabad Metro stations can you name from memory?',
  openGraph: {
    title: 'Ahmedabad Metro Memory',
    description: 'How many Ahmedabad Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/ahmedabad',
  },
})
