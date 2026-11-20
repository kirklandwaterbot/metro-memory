import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('national-rail', {
  icons: {
    icon: '/api/city-icon/national-rail',
    apple: '/api/city-icon/national-rail',
  },
  title: 'National Rail Memory',
  description: 'How many National Rail stations in Great Britain can you name from memory?',
  openGraph: {
    title: 'National Rail Memory',
    description: 'How many National Rail stations in Great Britain can you name from memory?',
    type: 'website',
    locale: 'en_GB',
    url: 'https://metro-memory.xyz/europe/uk/national-rail',
  },
})
