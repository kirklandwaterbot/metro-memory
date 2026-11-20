import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('yekaterinburg', {
  icons: {
    icon: '/api/city-icon/yekaterinburg',
    apple: '/api/city-icon/yekaterinburg',
  },
  title: 'Yekaterinburg Metro Memory',
  description: 'How many Yekaterinburg Metro stations can you name from memory?',
  openGraph: {
    title: 'Yekaterinburg Metro Memory',
    description: 'How many Yekaterinburg Metro stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/asia/russia/yekaterinburg',
  },
})
