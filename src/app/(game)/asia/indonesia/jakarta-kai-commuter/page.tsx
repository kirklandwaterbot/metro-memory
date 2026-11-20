import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('jakarta-kai-commuter')
}

export default async function Page() {
  return renderMiniCityPage('jakarta-kai-commuter')
}
