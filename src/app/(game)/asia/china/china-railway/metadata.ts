import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('china-railway', {
  icons: {
    icon: '/api/city-icon/china-railway',
    apple: '/api/city-icon/china-railway',
  },
  title: 'China Railway High-Speed Memory',
  description: 'How many China Railway high-speed stations can you name from memory?',
  openGraph: {
    title: 'China Railway High-Speed Memory',
    description: 'How many China Railway high-speed stations can you name from memory?',
    type: 'website',
    locale: 'zh_CN',
    url: 'https://metro-memory.xyz/asia/china/china-railway',
  },
})
