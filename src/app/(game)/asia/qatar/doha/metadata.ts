import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('doha', {
  icons: {
    icon: '/api/city-icon/doha',
    apple: '/api/city-icon/doha',
  },
  title: 'Doha Metro Memory',
  description: 'How many Doha Metro stations can you name from memory?',
  openGraph: {
    title: 'Doha Metro Memory',
    description: 'How many Doha Metro stations can you name from memory?',
    type: 'website',
    locale: 'ar_QA',
    url: 'https://metro-memory.xyz/asia/qatar/doha',
  },
})
