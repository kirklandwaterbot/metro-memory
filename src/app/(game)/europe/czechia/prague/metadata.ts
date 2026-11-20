import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('prague', {
  icons: {
    icon: '/api/city-icon/prague',
    apple: '/api/city-icon/prague',
  },
  title: 'Prague Metro Memory',
  description: 'How many Prague Metro stations can you name from memory?',
  openGraph: {
    title: 'Prague Metro Memory',
    description: 'How many Prague Metro stations can you name from memory?',
    type: 'website',
    locale: 'cs_CZ',
    url: 'https://metro-memory.xyz/europe/czechia/prague',
  },
})
