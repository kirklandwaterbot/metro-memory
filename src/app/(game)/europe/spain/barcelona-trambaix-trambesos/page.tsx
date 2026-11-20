import { generateMiniCityMetadata, renderMiniCityPage } from '@/lib/miniCityPage'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'

export async function generateMetadata() {
  return generateMiniCityMetadata('barcelona-trambaix-trambesos')
}

export default async function Page() {
  return renderMiniCityPage('barcelona-trambaix-trambesos')
}
