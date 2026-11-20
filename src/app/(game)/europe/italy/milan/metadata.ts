import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('milan', {
  icons: {
    icon: '/api/city-icon/milan',
    apple: '/api/city-icon/milan',
  },
  title: 'Milan Metro Memory',
  description: 'How many Milan Metro stations can you name from memory?',
  openGraph: {
    title: 'Milan Metro Memory',
    description: 'How many Milan Metro stations can you name from memory?',
    type: 'website',
    locale: 'it_IT',
    url: 'https://metro-memory.xyz/europe/italy/milan',
  },
})
