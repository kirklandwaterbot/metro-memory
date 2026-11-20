import type { Metadata } from 'next'
import { withCityAssetMetadata } from '@/lib/cityAssets'

export const metadata: Metadata = withCityAssetMetadata('bkk-srt', {
  icons: {
    icon: '/api/city-icon/bkk-srt',
    apple: '/api/city-icon/bkk-srt',
  },
  title: 'x',
  description: 'x',
  openGraph: {
    title: 'x',
    description: 'x',
    type: 'website',
    locale: 'th_TH',
    url: 'https://metro-memory.xyz/../../../data-sources/extras/bkk-srt',
  },
})
