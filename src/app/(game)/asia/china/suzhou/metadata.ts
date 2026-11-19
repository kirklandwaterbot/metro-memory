import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('suzhou', {
  icons: {
    icon: '/api/city-icon/suzhou',
    apple: '/api/city-icon/suzhou',
  },
  title: 'Suzhou Metro Memory',
  description: 'How many of the Suzhou rail transit stations can you name from memory?',
  openGraph: {
    title: 'Suzhou Metro Memory',
    description: 'How many of the Suzhou rail transit stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.xyz/asia/china/suzhou',
  },
})
