import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('novosibirsk', {
  icons: {
    icon: '/api/city-icon/novosibirsk',
    apple: '/api/city-icon/novosibirsk',
  },
  title: 'Novosibirsk Metro Memory',
  description: 'How many Novosibirsk Metro stations can you name from memory?',
  openGraph: {
    title: 'Novosibirsk Metro Memory',
    description: 'How many Novosibirsk Metro stations can you name from memory?',
    type: 'website',
    locale: 'ru_RU',
    url: 'https://metro-memory.xyz/asia/russia/novosibirsk',
  },
})
