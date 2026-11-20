#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'src', 'app', '(game)', 'north-america', 'usa', 'nyc')
const dataDir = path.join(root, 'data')

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const writeJson = (filePath, data) =>
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

const fullFeatures = readJson(path.join(dataDir, 'features.json'))
const fullRoutes = readJson(path.join(dataDir, 'routes.json'))
const fullLines = readJson(path.join(dataDir, 'lines.json'))

const NYCTA_A = [
  'NewYorkSubway1',
  'NewYorkSubway2',
  'NewYorkSubway3',
  'NewYorkSubway4',
  'NewYorkSubway5',
  'NewYorkSubway6',
  'NewYorkSubway6X',
  'NewYorkSubway7',
  'NewYorkSubway7X',
  'NewYorkSubwayGS',
]

const NYCTA_B = [
  'NewYorkSubwayA',
  'NewYorkSubwayB',
  'NewYorkSubwayC',
  'NewYorkSubwayD',
  'NewYorkSubwayE',
  'NewYorkSubwayF',
  'NewYorkSubwayFX',
  'NewYorkSubwayG',
  'NewYorkSubwayJ',
  'NewYorkSubwayL',
  'NewYorkSubwayM',
  'NewYorkSubwayN',
  'NewYorkSubwayQ',
  'NewYorkSubwayR',
  'NewYorkSubwayW',
  'NewYorkSubwayFS',
  'NewYorkSubwayH',
  'NewYorkSubwayZ',
]

const NYCTA_EXTRA = ['IBX', 'NewYorkSubwaySI', 'NewYorkSubwaySIExpress']

const PATH = [
  'NewYorkSubwayPATHHob33',
  'NewYorkSubwayPATHHobwtc',
  'NewYorkSubwayPATHJsq33',
  'NewYorkSubwayPATHNwkwtc',
]

const AIRTRAIN = [
  'AirTrainEWR',
  'AirTrainJFKHowardBeach',
  'AirTrainJFKJamaica',
  'AirTrainJFKAllTerminals',
]

const RIOC = ['RIOCRooseveltIslandTram']

const NJT_LIGHT_RAIL = [
  'NJTLR8thStHoboken',
  'NJTLRBayonneFlyer',
  'NJTLRWestSideTonnelle',
  'NJTLRHobokenTonnelle',
  'NJTLRNewark',
  'NJTLRNewarkBroad',
  'NJTLRRiverLine',
  'NJTLRGlassboroCamden',
]

const LIRR = [
  'LIRRBabylon',
  'LIRRBelmont',
  'LIRRAtlantic',
  'LIRRFarRockaway',
  'LIRRGreenport',
  'LIRRHempstead',
  'LIRRLongBeach',
  'LIRRMontauk',
  'LIRROysterBay',
  'LIRRPortJefferson',
  'LIRRPortWashington',
  'LIRRRonkonkoma',
  'LIRRWestHempstead',
]

const MNRR = [
  'MNRRHudson',
  'MNRRHarlem',
  'MNRRNewHaven',
  'MNRRNewCanaan',
  'MNRRDanbury',
  'MNRRWaterbury',
]

const NJT_RAIL = [
  'NJTNorthEastCorridor',
  'NJTPrinceton',
  'NJTNorthJerseyCoast',
  'NJTRaritanValley',
  'NJTAtlanticCity',
  'NJTMainLine',
  'NJTBergenCounty',
  'NJTPascackValley',
  'NJTPortJervis',
  'NJTMeadowlands',
  'NJTMontclairBoonton',
  'NJTMorrisEssex',
  'NJTGladstone',
  'NJTLackawannaCutOff',
]

const CTRAIL = ['CTRailShoreLineEast', 'CTRailHartfordLine']

const RAPID_LINES = new Set([
  ...NYCTA_A,
  ...NYCTA_B,
  ...NYCTA_EXTRA,
  ...PATH,
  ...AIRTRAIN,
  ...RIOC,
  ...NJT_LIGHT_RAIL,
])

const REGIONAL_LINES = new Set([...LIRR, ...MNRR, ...NJT_RAIL, ...CTRAIL])

const writeSubset = (linesSet, outDir) => {
  const filteredFeatures = fullFeatures.features.filter((feature) =>
    linesSet.has(feature.properties.line),
  )
  const filteredRoutes = fullRoutes.features.filter((feature) =>
    linesSet.has(feature.properties.line),
  )
  const filteredLines = Object.fromEntries(
    Object.entries(fullLines).filter(([line]) => linesSet.has(line)),
  )

  const stationsPerLine = {}
  for (const feature of filteredFeatures) {
    const line = feature.properties.line
    stationsPerLine[line] = (stationsPerLine[line] ?? 0) + 1
  }

  const featuresPayload = {
    type: 'FeatureCollection',
    features: filteredFeatures,
    properties: {
      totalStations: filteredFeatures.length,
      stationsPerLine,
    },
  }

  fs.mkdirSync(outDir, { recursive: true })
  writeJson(path.join(outDir, 'features.json'), featuresPayload)
  writeJson(
    path.join(outDir, 'routes.json'),
    {
      type: 'FeatureCollection',
      features: filteredRoutes,
    },
  )
  writeJson(path.join(outDir, 'lines.json'), filteredLines)
}

const backupDir = path.join(dataDir, 'full')
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
  fs.copyFileSync(path.join(dataDir, 'features.json'), path.join(backupDir, 'features.json'))
  fs.copyFileSync(path.join(dataDir, 'routes.json'), path.join(backupDir, 'routes.json'))
  fs.copyFileSync(path.join(dataDir, 'lines.json'), path.join(backupDir, 'lines.json'))
}

writeSubset(RAPID_LINES, dataDir)
writeSubset(REGIONAL_LINES, path.join(root, 'regional-rail', 'data'))

console.log('NY data split complete.')
