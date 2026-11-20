import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('osaka-kobe-kita-osaka-kyuko')
}

export default async function Page() {
  return renderMiniCityPage('osaka-kobe-kita-osaka-kyuko')
}
