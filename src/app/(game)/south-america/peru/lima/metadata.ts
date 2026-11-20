import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lima', {
  icons: {
    icon: '/api/city-icon/lima',
    apple: '/api/city-icon/lima',
  },
  title: 'Lima Metro Memory',
  description: 'How many Metro de Lima y Callao stations can you name from memory?',
  openGraph: {
    title: 'Lima Metro Memory',
    description: 'How many Metro de Lima y Callao stations can you name from memory?',
    type: 'website',
    locale: 'es_PE',
    url: 'https://metro-memory.xyz/south-america/peru/lima',
  },
})
