import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('lyon', {
  icons: {
    icon: '/api/city-icon/lyon',
    apple: '/api/city-icon/lyon',
  },
  title: 'Lyon Metro Memory',
  description: 'How many Lyon Metro stations can you name from memory?',
  openGraph: {
    title: 'Lyon Metro Memory',
    description: 'How many Lyon Metro stations can you name from memory?',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.xyz/europe/france/lyon',
  },
})
