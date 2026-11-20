import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lagos', {
  icons: {
    icon: '/api/city-icon/lagos',
    apple: '/api/city-icon/lagos',
  },
  title: 'Lagos Metro Memory',
  description: 'How many Lagos Rail Mass Transit stations can you name from memory?',
  openGraph: {
    title: 'Lagos Metro Memory',
    description: 'How many Lagos Rail Mass Transit stations can you name from memory?',
    type: 'website',
    locale: 'en_NG',
    url: 'https://metro-memory.xyz/africa/nigeria/lagos',
  },
})
