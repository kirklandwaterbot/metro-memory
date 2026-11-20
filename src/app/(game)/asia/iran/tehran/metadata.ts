import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tehran', {
  icons: {
    icon: '/api/city-icon/tehran',
    apple: '/api/city-icon/tehran',
  },
  title: 'Tehran Metro Memory',
  description: 'How many Tehran Metro stations can you name from memory?',
  openGraph: {
    title: 'Tehran Metro Memory',
    description: 'How many Tehran Metro stations can you name from memory?',
    type: 'website',
    locale: 'fa_IR',
    url: 'https://metro-memory.xyz/asia/iran/tehran',
  },
})
