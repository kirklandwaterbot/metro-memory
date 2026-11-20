import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('nagoya', {
  icons: {
    icon: '/api/city-icon/nagoya',
    apple: '/api/city-icon/nagoya',
  },
  title: 'Nagoya Metro Memory',
  description: 'How many Nagoya Subway, Aonami Line and Linimo stations can you name from memory?',
  openGraph: {
    title: 'Nagoya Metro Memory',
    description: 'How many Nagoya Subway, Aonami Line and Linimo stations can you name from memory?',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://metro-memory.xyz/asia/japan/nagoya',
  },
})
