import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('almaty', {
  icons: {
    icon: '/api/city-icon/almaty',
    apple: '/api/city-icon/almaty',
  },
  title: 'Almaty Metro Memory',
  description: 'How many Almaty Metro stations can you name from memory?',
  openGraph: {
    title: 'Almaty Metro Memory',
    description: 'How many Almaty Metro stations can you name from memory?',
    type: 'website',
    locale: 'kk_KZ',
    url: 'https://metro-memory.xyz/asia/kazakhstan/almaty',
  },
})
