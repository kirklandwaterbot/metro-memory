import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('cairo', {
  icons: {
    icon: '/api/city-icon/cairo',
    apple: '/api/city-icon/cairo',
  },
  title: 'Cairo Metro Memory',
  description: 'How many Cairo Metro stations can you name from memory?',
  openGraph: {
    title: 'Cairo Metro Memory',
    description: 'How many Cairo Metro stations can you name from memory?',
    type: 'website',
    locale: 'ar_EG',
    url: 'https://metro-memory.xyz/africa/egypt/cairo',
  },
})
