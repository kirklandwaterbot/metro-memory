import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kunming', {
  icons: {
    icon: '/api/city-icon/kunming',
    apple: '/api/city-icon/kunming',
  },
  title: 'Kunming Metro Memory',
  description: 'How many of the Kunming rail transit stations can you name from memory?',
  openGraph: {
    title: 'Kunming Metro Memory',
    description: 'How many of the Kunming rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/kunming',
  },
})
