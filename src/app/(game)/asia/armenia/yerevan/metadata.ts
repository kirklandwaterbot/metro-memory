import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('yerevan', {
  icons: {
    icon: '/api/city-icon/yerevan',
    apple: '/api/city-icon/yerevan',
  },
  title: 'Yerevan Metro Memory',
  description: 'How many Yerevan Metro stations can you name from memory?',
  openGraph: {
    title: 'Yerevan Metro Memory',
    description: 'How many Yerevan Metro stations can you name from memory?',
    type: 'website',
    locale: 'hy_AM',
    url: 'https://metro-memory.xyz/asia/armenia/yerevan',
  },
})
