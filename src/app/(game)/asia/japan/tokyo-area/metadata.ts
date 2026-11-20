import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('tokyo-area', {
  icons: {
    icon: '/api/city-icon/tokyo-area',
    apple: '/api/city-icon/tokyo-area',
  },
  title: 'Greater Tokyo Metros Memory',
  description: 'How many Greater Tokyo Metros stations can you name from memory?',
  openGraph: {
    title: 'Greater Tokyo Metros Memory',
    description: 'How many Greater Tokyo Metros stations can you name from memory?',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://metro-memory.xyz/asia/japan/tokyo-area',
  },
})
