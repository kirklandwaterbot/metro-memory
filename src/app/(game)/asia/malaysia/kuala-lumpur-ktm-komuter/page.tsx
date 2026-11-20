import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('kuala-lumpur-ktm-komuter')
}

export default async function Page() {
  return renderMiniCityPage('kuala-lumpur-ktm-komuter')
}
