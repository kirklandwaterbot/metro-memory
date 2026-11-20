import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('minsk', {
  icons: {
    icon: '/api/city-icon/minsk',
    apple: '/api/city-icon/minsk',
  },
  title: 'Minsk Metro Memory',
  description: 'How many Minsk Metro stations can you name from memory?',
  openGraph: {
    title: 'Minsk Metro Memory',
    description: 'How many Minsk Metro stations can you name from memory?',
    type: 'website',
    locale: 'be_BY',
    url: 'https://metro-memory.xyz/europe/belarus/minsk',
  },
})
