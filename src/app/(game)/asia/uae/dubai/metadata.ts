import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('dubai', {
  icons: {
    icon: '/api/city-icon/dubai',
    apple: '/api/city-icon/dubai',
  },
  title: 'Dubai Metro Memory',
  description: 'How many Dubai Metro stations can you name from memory?',
  openGraph: {
    title: 'Dubai Metro Memory',
    description: 'How many Dubai Metro stations can you name from memory?',
    type: 'website',
    locale: 'ar_AE',
    url: 'https://metro-memory.xyz/asia/uae/dubai',
  },
})
