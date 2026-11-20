import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('viarail', {
  icons: {
    icon: '/api/city-icon/viarail',
    apple: '/api/city-icon/viarail',
  },
  title: 'VIA Rail Memory',
  description: 'How many VIA Rail stations across Canada can you name from memory?',
  openGraph: {
    title: 'VIA Rail Memory',
    description: 'How many VIA Rail stations across Canada can you name from memory?',
    type: 'website',
    locale: 'en_CA',
    url: 'https://metro-memory.xyz/north-america/canada/viarail',
  },
})
