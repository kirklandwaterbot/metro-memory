import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('sofia', {
  icons: {
    icon: '/api/city-icon/sofia',
    apple: '/api/city-icon/sofia',
  },
  title: 'Sofia Metro Memory',
  description: 'How many Sofia Metro stations can you name from memory?',
  openGraph: {
    title: 'Sofia Metro Memory',
    description: 'How many Sofia Metro stations can you name from memory?',
    type: 'website',
    locale: 'bg_BG',
    url: 'https://metro-memory.xyz/europe/bulgaria/sofia',
  },
})
