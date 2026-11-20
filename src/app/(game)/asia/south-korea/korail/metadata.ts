import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('korail', {
  icons: {
    icon: '/api/city-icon/korail',
    apple: '/api/city-icon/korail',
  },
  title: 'Korail Memory',
  description: 'How many Korail (KTX, SRT, ITX, Mugunghwa and Korail metro) stations can you name from memory?',
  openGraph: {
    title: 'Korail Memory',
    description: 'How many Korail (KTX, SRT, ITX, Mugunghwa and Korail metro) stations can you name from memory?',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://metro-memory.xyz/asia/south-korea/korail',
  },
})
