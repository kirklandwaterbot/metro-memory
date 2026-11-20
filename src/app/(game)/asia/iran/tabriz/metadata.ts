import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tabriz', {
  icons: {
    icon: '/api/city-icon/tabriz',
    apple: '/api/city-icon/tabriz',
  },
  title: 'Tabriz Metro Memory',
  description: 'How many Tabriz Metro stations can you name from memory?',
  openGraph: {
    title: 'Tabriz Metro Memory',
    description: 'How many Tabriz Metro stations can you name from memory?',
    type: 'website',
    locale: 'fa_IR',
    url: 'https://metro-memory.xyz/asia/iran/tabriz',
  },
})
