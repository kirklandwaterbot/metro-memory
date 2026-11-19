import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('dujiangyan', {
  icons: {
    icon: '/api/city-icon/dujiangyan',
    apple: '/api/city-icon/dujiangyan',
  },
  title: 'Dujiangyan Metro Memory',
  description: 'How many of the Dujiangyan rail transit stations can you name from memory?',
  openGraph: {
    title: 'Dujiangyan Metro Memory',
    description: 'How many of the Dujiangyan rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/dujiangyan',
  },
})
