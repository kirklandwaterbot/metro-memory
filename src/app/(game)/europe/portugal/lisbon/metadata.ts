import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lisbon', {
  icons: {
    icon: '/api/city-icon/lisbon',
    apple: '/api/city-icon/lisbon',
  },
  title: 'Lisbon Metro Memory',
  description: 'How many Lisbon Metro stations can you name from memory?',
  openGraph: {
    title: 'Lisbon Metro Memory',
    description: 'How many Lisbon Metro stations can you name from memory?',
    type: 'website',
    locale: 'pt_PT',
    url: 'https://metro-memory.xyz/europe/portugal/lisbon',
  },
})
