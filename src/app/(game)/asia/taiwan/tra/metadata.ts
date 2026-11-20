import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tra', {
  icons: {
    icon: '/api/city-icon/tra',
    apple: '/api/city-icon/tra',
  },
  title: 'Taiwan Railway Memory',
  description: 'How many Taiwan Railway (TRA) stations can you name from memory?',
  openGraph: {
    title: 'Taiwan Railway Memory',
    description: 'How many Taiwan Railway (TRA) stations can you name from memory?',
    type: 'website',
    locale: 'zh_TW',
    url: 'https://metro-memory.xyz/asia/taiwan/tra',
  },
})
