import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('santiago', {
  icons: {
    icon: '/api/city-icon/santiago',
    apple: '/api/city-icon/santiago',
  },
  title: 'Santiago Metro Memory',
  description: 'How many Metro de Santiago stations can you name from memory?',
  openGraph: {
    title: 'Santiago Metro Memory',
    description: 'How many Metro de Santiago stations can you name from memory?',
    type: 'website',
    locale: 'es_CL',
    url: 'https://metro-memory.xyz/south-america/chile/santiago',
  },
})
