import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('bangkok-srt-commuter-rail')
}

export default async function Page() {
  return renderMiniCityPage('bangkok-srt-commuter-rail')
}
