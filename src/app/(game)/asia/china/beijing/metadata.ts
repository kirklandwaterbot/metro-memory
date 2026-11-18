import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('beijing', {
  icons: {
    icon: '/api/city-icon/beijing',
    apple: '/api/city-icon/beijing',
  },
  title: 'Beijing Rail Transit Metro Memory',
  description:
    "How many of Beijing's rail transit stations can you name from memory?",
  openGraph: {
    title: 'Beijing Rail Transit Metro Memory',
    description:
      "How many of Beijing's rail transit stations can you name from memory?",
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/beijing',
  },
})
