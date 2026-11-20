import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('xishui', {
  icons: {
    icon: '/api/city-icon/xishui',
    apple: '/api/city-icon/xishui',
  },
  title: 'Xishui Forest Train Memory',
  description: 'How many stations of the Xishui Forest Train can you name from memory?',
  openGraph: {
    title: 'Xishui Forest Train Memory',
    description: 'How many stations of the Xishui Forest Train can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/xishui',
  },
})
