import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('melbourne', {
  icons: {
    icon: '/api/city-icon/melbourne',
    apple: '/api/city-icon/melbourne',
  },
  title: 'Melbourne Metro Memory',
  description: 'How many Metro Trains Melbourne stations can you name from memory?',
  openGraph: {
    title: 'Melbourne Metro Memory',
    description: 'How many Metro Trains Melbourne stations can you name from memory?',
    type: 'website',
    locale: 'en_AU',
    url: 'https://metro-memory.xyz/oceania/australia/melbourne',
  },
})
