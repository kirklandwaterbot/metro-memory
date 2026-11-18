// Which lines may borrow each other's track when filling gaps. A line only
// borrows from its own family, so a subway gap is never drawn along a
// commuter-rail track (or vice versa). Unlisted cities use one family.

const PRESETS = {
  nyc: [
    { family: 'path', match: /^NewYorkSubwayPATH/ },
    { family: 'subway', match: /^NewYorkSubway/ },
    { family: 'njt-light-rail', match: /^NJTLR/ },
    { family: 'commuter', match: /^(LIRR|MNRR|NJT|CTRail)/ },
    { family: 'airtrain', match: /^AirTrain/ },
  ],
}

// Backup track per family (see data-sources/<city>/README.md), and optional
// "coverage": the official route of a line, used to find stretches where the
// line should run but nothing is drawn (e.g. an NJT line stopping short of
// Hoboken). Coverage is only set where the game follows today's real routes.
const REFERENCES = {
  nyc: {
    files: [
      { family: 'commuter', file: 'data-sources/nyc/njt-rail-gtfs-shapes.geojson' },
      { family: 'subway', file: 'data-sources/nyc/subway-gtfs-shapes.geojson' },
    ],
    coverage: {
      file: 'data-sources/nyc/njt-rail-gtfs-shapes.geojson',
      key: 'route',
      lines: {
        NJTAtlanticCity: 'ATLC',
        NJTMontclairBoonton: 'BNTN',
        NJTMainLine: 'MNBN',
        NJTBergenCounty: 'MNBN',
        NJTMorrisEssex: 'MNE',
        NJTGladstone: 'MNEG',
        NJTMeadowlands: 'MRL',
        NJTNorthEastCorridor: 'NEC',
        NJTNorthJerseyCoast: 'NJCL',
        NJTPascackValley: 'PASC',
        NJTPrinceton: 'PRIN',
        NJTRaritanValley: 'RARV',
      },
    },
  },
}

function referencesFor(slug) {
  return REFERENCES[slug] || { files: [], coverage: null }
}

function familyResolver(slug) {
  const rules = PRESETS[slug]
  if (!rules) return () => 'all'
  return (line) => {
    const rule = rules.find((r) => r.match.test(line))
    return rule ? rule.family : `own:${line}`
  }
}

module.exports = { familyResolver, referencesFor, PRESETS, REFERENCES }
