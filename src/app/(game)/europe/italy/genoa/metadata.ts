import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('genoa', {
  icons: {
    icon: '/api/city-icon/genoa',
    apple: '/api/city-icon/genoa',
  },
  title: 'Genoa Metro Memory',
  description: 'How many Genoa Metro stations can you name from memory?',
  openGraph: {
    title: 'Genoa Metro Memory',
    description: 'How many Genoa Metro stations can you name from memory?',
    type: 'website',
    locale: 'it_IT',
    url: 'https://metro-memory.xyz/europe/italy/genoa',
  },
})
