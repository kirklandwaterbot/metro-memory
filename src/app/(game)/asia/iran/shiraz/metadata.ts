import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('shiraz', {
  icons: {
    icon: '/api/city-icon/shiraz',
    apple: '/api/city-icon/shiraz',
  },
  title: 'Shiraz Metro Memory',
  description: 'How many Shiraz Metro stations can you name from memory?',
  openGraph: {
    title: 'Shiraz Metro Memory',
    description: 'How many Shiraz Metro stations can you name from memory?',
    type: 'website',
    locale: 'fa_IR',
    url: 'https://metro-memory.xyz/asia/iran/shiraz',
  },
})
