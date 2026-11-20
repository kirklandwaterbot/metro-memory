import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('hyderabad', {
  icons: {
    icon: '/api/city-icon/hyderabad',
    apple: '/api/city-icon/hyderabad',
  },
  title: 'Hyderabad Metro Memory',
  description: 'How many Hyderabad Metro stations can you name from memory?',
  openGraph: {
    title: 'Hyderabad Metro Memory',
    description: 'How many Hyderabad Metro stations can you name from memory?',
    type: 'website',
    locale: 'en_IN',
    url: 'https://metro-memory.xyz/asia/india/hyderabad',
  },
})
