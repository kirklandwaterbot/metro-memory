import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kiwirail', {
  icons: {
    icon: '/api/city-icon/kiwirail',
    apple: '/api/city-icon/kiwirail',
  },
  title: 'KiwiRail Memory',
  description: 'How many KiwiRail passenger stations can you name from memory?',
  openGraph: {
    title: 'KiwiRail Memory',
    description: 'How many KiwiRail passenger stations can you name from memory?',
    type: 'website',
    locale: 'en_NZ',
    url: 'https://metro-memory.xyz/oceania/new-zealand/kiwirail',
  },
})
