import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('dhaka', {
  icons: {
    icon: '/api/city-icon/dhaka',
    apple: '/api/city-icon/dhaka',
  },
  title: 'Dhaka Metro Rail Memory',
  description: 'How many Dhaka Metro Rail stations can you name from memory?',
  openGraph: {
    title: 'Dhaka Metro Rail Memory',
    description: 'How many Dhaka Metro Rail stations can you name from memory?',
    type: 'website',
    locale: 'bn_BD',
    url: 'https://metro-memory.xyz/asia/bangladesh/dhaka',
  },
})
