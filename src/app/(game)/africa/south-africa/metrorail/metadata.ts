import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('metrorail', {
  icons: {
    icon: '/api/city-icon/metrorail',
    apple: '/api/city-icon/metrorail',
  },
  title: 'Metrorail Memory',
  description: 'How many Metrorail stations across South Africa can you name from memory?',
  openGraph: {
    title: 'Metrorail Memory',
    description: 'How many Metrorail stations across South Africa can you name from memory?',
    type: 'website',
    locale: 'en_ZA',
    url: 'https://metro-memory.xyz/africa/south-africa/metrorail',
  },
})
