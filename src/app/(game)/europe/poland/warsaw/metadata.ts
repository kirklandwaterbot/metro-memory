import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('warsaw', {
  icons: {
    icon: '/api/city-icon/warsaw',
    apple: '/api/city-icon/warsaw',
  },
  title: 'Warsaw Metro Memory',
  description: 'How many Warsaw Metro stations can you name from memory?',
  openGraph: {
    title: 'Warsaw Metro Memory',
    description: 'How many Warsaw Metro stations can you name from memory?',
    type: 'website',
    locale: 'pl_PL',
    url: 'https://metro-memory.xyz/europe/poland/warsaw',
  },
})
