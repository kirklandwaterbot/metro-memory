import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('kryvyi-rih', {
  icons: {
    icon: '/api/city-icon/kryvyi-rih',
    apple: '/api/city-icon/kryvyi-rih',
  },
  title: 'Kryvyi Rih Metrotram Memory',
  description: 'How many Kryvyi Rih Metrotram stations can you name from memory?',
  openGraph: {
    title: 'Kryvyi Rih Metrotram Memory',
    description: 'How many Kryvyi Rih Metrotram stations can you name from memory?',
    type: 'website',
    locale: 'uk_UA',
    url: 'https://metro-memory.xyz/europe/ukraine/kryvyi-rih',
  },
})
