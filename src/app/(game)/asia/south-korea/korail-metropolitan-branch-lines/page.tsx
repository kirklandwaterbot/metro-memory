import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('korail-metropolitan-branch-lines')
}

export default async function Page() {
  return renderMiniCityPage('korail-metropolitan-branch-lines')
}
