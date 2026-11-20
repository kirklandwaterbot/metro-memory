import { repairMojibakeString } from './repairMojibake.ts'

const canonicalizeRoadSuffixes = (str: string) =>
  str
    .replace(/\bavenu?e?\b/g, 'av')
    .replace(/\bav\b/g, 'av')
    .replace(/\bst(?:reet)?\b/g, 'st')
    .replace(/\bstr\b/g, 'st')
    .replace(/\broad\b/g, 'rd')
    .replace(/\brd\b/g, 'rd')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\bpl\b/g, 'pl')
    .replace(/\bplaza\b/g, 'plz')
    .replace(/\bplz\b/g, 'plz')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bblvd\b/g, 'blvd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\bdr\b/g, 'dr')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bct\b/g, 'ct')
    .replace(/\bsquare\b/g, 'sq')
    .replace(/\bsq\b/g, 'sq')
    .replace(/\bparkway\b/g, 'pkwy')
    .replace(/\bpkwy\b/g, 'pkwy')
    .replace(/\bhighway\b/g, 'hwy')
    .replace(/\bhwy\b/g, 'hwy')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bln\b/g, 'ln')
    .replace(/\bterrace\b/g, 'ter')
    .replace(/\bter\b/g, 'ter')
    .replace(/\bcrescent\b/g, 'cres')
    .replace(/\bcres\b/g, 'cres')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\bcir\b/g, 'cir')

const applyCommonAbbreviations = (str: string) =>
  str
    .replace(/\bsainte\b/g, 'ste')
    .replace(/\bste\b/g, 'ste')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bst\b/g, 'st')
    .replace(/\bmount(?:ain)?\b/g, 'mt')
    .replace(/\bmt\b/g, 'mt')
    .replace(/street/g, 'st')
    .replace(/ avenue/g, ' av')
    .replace(/ ave/g, ' av')
    .replace(/\bavenue ([a-z])\b/g, ' av $1')
    .replace(/\bave ([a-z])\b/g, ' av $1')
    .replace(/ road/g, ' rd')
    .replace(/ parkway/g, ' pkwy')
    .replace(/\bpark\b/g, ' pk')
    .replace(/ square/g, ' sq')
    .replace(/\bplaza\b/g, ' plz')
    .replace(/ drive/g, ' dr')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/ junction/g, ' jct')
    .replace(/ place/g, ' pl')
    .replace(/\btransit center\b/g, '')
    .replace(/\bcenter\b/g, '')
    .replace(/\bcentre\b/g, '')
    .replace(/\bhub\b/g, '')
    .replace(/\bstation\b/g, '')
    .replace(/ boulevard/g, ' blvd')
    .replace(/\bpoint\b/g, ' pt')
    .replace(/\bfort\b/g, 'ft')
    .replace(/ railway/g, '')
    .replace(/ rail/g, '')
    .replace(/\bnorthwest\b/g, 'nw')
    .replace(/\bnortheast\b/g, 'ne')
    .replace(/\bsouthwest\b/g, 'sw')
    .replace(/\bsoutheast\b/g, 'se')
    .replace(/\bnorth\b/g, 'n')
    .replace(/\bsouth\b/g, 's')
    .replace(/\beast\b/g, 'e')
    .replace(/\bwest\b/g, 'w')
    .replace(/\b(?:and|und|et|y|with)\b/g, ' ')
    .replace(/ & /g, ' ')

const stripNumericOrdinalSuffixes = (str: string) =>
  str.replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1')

const FLOATING_MODIFIER_ORDER = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
  'downtown',
  'uptown',
  'midtown',
]

const FLOATING_MODIFIER_SET = new Set(FLOATING_MODIFIER_ORDER)

const canonicalizeFloatingModifiers = (str: string) => {
  const tokens = str.split(/\s+/).filter(Boolean)
  if (tokens.length <= 1) {
    return str
  }

  const coreTokens: string[] = []
  const modifierTokens: string[] = []

  tokens.forEach((token) => {
    if (FLOATING_MODIFIER_SET.has(token)) {
      modifierTokens.push(token)
    } else {
      coreTokens.push(token)
    }
  })

  if (modifierTokens.length === 0 || coreTokens.length === 0) {
    return str
  }

  modifierTokens.sort((a, b) => {
    const aIndex = FLOATING_MODIFIER_ORDER.indexOf(a)
    const bIndex = FLOATING_MODIFIER_ORDER.indexOf(b)
    return aIndex - bIndex
  })

  return [...coreTokens, ...modifierTokens].join(' ')
}

const replacers: { [key: string]: (str: string) => string } = {
  default: (str: string) => str,

  berlin: (str) =>
    str
      .replace(/stra\u00dfe/g, 'str')
      .replace(/strasse/g, 'str')
      .replace(/ und /g, ' ')
      .replace(/ & /g, ' ')
      .replace(/\u00df/g, 'ss'),

  potsdam: (str) =>
    str
      .replace(/stra\u00dfe/g, 'str')
      .replace(/strasse/g, 'str')
      .replace(/bhf/g, 'bahnhof')
      .replace(/\u00df/g, 'ss'),

  hamburg: (str) =>
    str
      .replace(/stra\u00dfe/g, 'str')
      .replace(/strasse/g, 'str')
      .replace(/ und /g, ' ')
      .replace(/ & /g, ' ')
      .replace(/hbf/g, 'hauptbahnhof')
      .replace(/\u00df/g, 'ss'),

  munich: (str) =>
    str
      .replace(/stra\u00dfe/g, 'str')
      .replace(/strasse/g, 'str')
      .replace(/ und /g, ' ')
      .replace(/ & /g, ' ')
      .replace(/hbf/g, 'hauptbahnhof')
      .replace(/\u00df/g, 'ss')
      .replace(/saint /g, 'st '),

  london: (str) =>
    str
      .replace(/street/g, 'st')
      .replace(/ road/g, ' rd')
      .replace(/saint /g, 'st ')
      .replace(/ and /g, ' ')
      .replace(/ & /g, ' '),

  vienna: (str) =>
    str
      .replace(/\u00df/g, 'ss')
      .replace(/strasse/g, 'str')
      .replace(/gasse/g, 'g')
      .replace(/sankt/g, 'st')
      .replace(/platz/g, 'pl')
      .replace(/bahnhof/g, 'bhf')
      .replace(/ und /g, ' ')
      .replace(/ & /g, ' '),

  dc: (str) =>
    str
      .replace(/street/g, 'st')
      .replace(/ avenue/g, ' av')
      .replace(/ ave/g, ' av')
      .replace(/ heights/g, ' hts')
      .replace(/ road/g, ' rd')
      .replace(/ parkway/g, ' pkwy')
      .replace(/ square/g, ' sq')
      .replace(/ junction/g, ' jct')
      .replace(/ place/g, ' pl')
      .replace(/ center/g, ' ctr')
      .replace(/ boulevard/g, ' blvd')
      .replace(/ south west/g, ' sw')
      .replace(/ east/g, ' e')
      .replace(/george mason university/g, 'gmu')
      .replace(/george washington university/g, 'gwu')
      .replace(/north of massachusetts avenue/g, ' noma')
      .replace(/university of maryland/g, ' u of md')
      .replace(/ university/g, ' u')
      .replace(/saint /g, 'st ')
      .replace(/mount /g, 'mt ')
      .replace(/iad/g, 'dulles airport')
      .replace(/dca/g, 'reagan airport')
      .replace(/th /g, ' ')
      .replace(/1st /g, '1 ')
      .replace(/2nd /g, '2 ')
      .replace(/3rd /g, '3 ')
      .replace(/east /g, 'e ')
      .replace(/west /g, 'o ')
      .replace(/north /g, 'n ')
      .replace(/south /g, 's ')
      .replace(/ and /g, ' ')
      .replace(/ & /g, ' '),

  chicago: (str) =>
    str
      .replace(/street/g, 'st')
      .replace(/ avenue/g, ' av')
      .replace(/ ave/g, ' av')
      .replace(/ heights/g, ' hts')
      .replace(/ road/g, ' rd')
      .replace(/ parkway/g, ' pkwy')
      .replace(/ square/g, ' sq')
      .replace(/ junction/g, ' jct')
      .replace(/ place/g, ' pl')
      .replace(/ center/g, ' ctr')
      .replace(/ boulevard/g, ' blvd')
      .replace(/ south west/g, ' sw')
      .replace(/ east/g, ' e')
      .replace(/ and /g, ' ')
      .replace(/ & /g, ' '),

  boston: (str) =>
    str
      .replace(/saint/g, 'st')
      .replace(/street/g, 'st')
      .replace(/ avenue/g, ' av')
      .replace(/ ave/g, ' av')
      .replace(/ heights/g, ' hts')
      .replace(/ road/g, ' rd')
      .replace(/ parkway/g, ' pkwy')
      .replace(/ square/g, ' sq')
      .replace(/ junction/g, ' jct')
      .replace(/ place/g, ' pl')
      .replace(/ center/g, ' ctr')
      .replace(/ boulevard/g, ' blvd')
      .replace(/ south west/g, ' sw')
      .replace(/ east/g, ' e')
      .replace(/ and /g, ' ')
      .replace(/ & /g, ' ')
      .replace(/bu /g, 'boston university '),

  ny: (str) =>
    str
      .replace(/street/g, 'st')
      .replace(/ avenue/g, ' av')
      .replace(/ ave/g, ' av')
      .replace(/\bavenue ([a-z])\b/g, ' av $1')
      .replace(/\bave ([a-z])\b/g, ' av $1')
      .replace(/\bbeach(?=\s+\d)/g, 'b')
      .replace(/\bheights\b/g, 'hts')
      .replace(/ road/g, ' rd')
      .replace(/ parkway/g, ' pkwy')
      .replace(/\bpark\b/g, ' pk')
      .replace(/ square/g, ' sq')
      .replace(/\bplaza\b/g, ' plz')
      .replace(/ drive/g, ' dr')
      .replace(/\bcourt\b/g, 'ct')
      .replace(/ junction/g, ' jct')
      .replace(/ place/g, ' pl')
      .replace(/\bcenter\b/g, 'ctr')
      .replace(/\bfort\b/g, 'ft')
      .replace(/ boulevard/g, ' blvd')
      .replace(/\bpoint\b/g, ' pt')
      .replace(/\broute\b/g, ' rte')
      .replace(/ port authority bus terminal/g, ' pabt')
      .replace(/new york university/g, 'nyu')
      .replace(/new york/g, 'ny')
      .replace(/airport/g, '')
      .replace(/washington/g, 'wash')
      .replace(/brooklyn/g, 'blkyn')
      .replace(/saint /g, 'st ')
      .replace(/mount /g, 'mt ')
      .replace(/first /g, '1 ')
      .replace(/second /g, '2 ')
      .replace(/third /g, '3 ')
      .replace(/fourth /g, '4 ')
      .replace(/fifth /g, '5 ')
      .replace(/sixth /g, '6 ')
      .replace(/seventh /g, '7 ')
      .replace(/eighth /g, '8 ')
      .replace(/ninth /g, '9 ')
      .replace(/tenth /g, '10 ')
      .replace(/eleventh /g, '11 ')
      .replace(/twelfth /g, '12 ')
      .replace(/thirteenth /g, '13 ')
      .replace(/fourteenth /g, '14 ')
      .replace(/fifteenth /g, '15 ')
      .replace(/sixteenth /g, '16 ')
      .replace(/seventeenth /g, '17 ')
      .replace(/eighteenth /g, '18 ')
      .replace(/nineteenth /g, '19 ')
      .replace(/twentieth /g, '20 ')
      .replace(/th /g, ' ')
      .replace(/1st /g, '1 ')
      .replace(/2nd /g, '2 ')
      .replace(/3rd /g, '3 ')
      .replace(/east /g, 'e ')
      .replace(/west /g, 'w ')
      .replace(/north /g, 'n ')
      .replace(/south /g, 's ')
      .replace(/ and /g, ' ')
      .replace(/ & /g, ' '),

  barcelona: (str) =>
    str
      .replace(/carrer/g, 'c')
      .replace(/calle/g, 'c')
      .replace(/avinguda/g, 'av')
      .replace(/placa/g, 'pl')
      .replace(/pla\u00e7a/g, 'pl')
      .replace(/passeig/g, 'pg')
      .replace('/sant /g', 'st ')
      .replace(/rambla/g, 'rbla'),

  seoul: (str) =>
    str
      .toLowerCase()
      .replace(/\([^()]*\)/g, '')
      .replace('university', 'univ')
      .replace('international', 'intl')
      .replace('national', 'natl')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),

  tokyo: (str) =>
    str
      .toLowerCase()
      .replace(/\([^()]*\)/g, '')
      .replace(/\([^<>]*\)/g, '')
      .replace(/\([^〈〉]*\)/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
}

const NON_LATIN_ALLOWED_CITIES = new Set([
  'beijing',
  'changzhou',
  'gba',
  'guiyang',
  'harbin',
  'hohhot',
  'hanoi',
  'hochiminhcity',
  'istanbul',
  'kaohsiung',
  'jinhua',
  'lanzhou',
  'luoyang',
  'pyongyang',
  'nanning',
  'nantong',
  'shijiazhuang',
  'taizhou',
  'taiyuan',
  'nanchang',
  'xuzhou',
  'shenyang',
  'wuxi',
  'changchun',
  'dalian',
  'fuzhou',
  'hefei',
  'jinan',
  'kunming',
  'changsha',
  'ningbo',
  'qingdao',
  'suzhou',
  'chongqing',
  'zhengzhou',
  'wuhan',
  'hangzhou',
  'nanjing',
  'tianjin',
  'xian',
  'chengdu',
  'fukuoka',
  'hiroshima',
  'nagoya',
  'okayama',
  'osaka-kobe',
  'kyoto',
  'sapporo',
  'sendai',
  'daegu',
  'daejeon',
  'busan',
  'gwangju',
  'kuala-lumpur',
  'bangkok',
  'huaian',
  'huangshi',
  'mengzhi',
  'jiaxing',
  'sanya',
  'tianshui',
  'qiubei',
  'nanping',
  'zhangjiakou',
  'delingha',
  'lijiang',
  'zhangye',
  'fenghuang',
  'xishui',
  'yinchuan',
  'liupanshui',
  'guangan',
  'guilin',
  'jining',
  'bengbu',
  'guadalajara',
  'monterrey',
  'urumqi',
  'seoul',
  'shanghai',
  'singapore',
  'taichung',
  'taipei',
  'taw',
  'thsr',
  'tokyo',
  'wuhu',
  'xiamen',
  // Former Soviet Union: Cyrillic, Georgian and Armenian answers
  'moscow',
  'saint-petersburg',
  'nizhny-novgorod',
  'novosibirsk',
  'samara',
  'yekaterinburg',
  'kazan',
  'volgograd',
  'kyiv',
  'kharkiv',
  'dnipro',
  'kryvyi-rih',
  'minsk',
  'tbilisi',
  'yerevan',
  'baku',
  'tashkent',
  'almaty',
  // Rest-of-world metros with non-Latin answers
  'tra',
  'korean-state-railway',
  'korail',
  'china-railway',
  'russian-railways',
  'sofia',
  'athens',
  'thessaloniki',
  'cairo',
  'dubai',
  'doha',
  'riyadh',
  'mecca',
  'tehran',
  'mashhad',
  'isfahan',
  'shiraz',
  'tabriz',
  'karaj',
  'lahore',
  'dhaka',
  'delhi',
  'mumbai',
  'kolkata',
  'chennai',
  'bengaluru',
  'hyderabad',
  'ahmedabad',
  'pune',
  'nagpur',
  'kochi',
  'lucknow',
  'jaipur',
  'kanpur',
  'agra',
  'bhopal',
  'indore',
  'meerut',
  'patna',
  'astana',
  'yokohama',
  'tokyo-area',
])

const isNonLatinAllowedCity = (city: string): boolean => {
  if (NON_LATIN_ALLOWED_CITIES.has(city)) return true
  const dashIndex = city.indexOf('-')
  if (dashIndex > 0) {
    const parentSlug = city.slice(0, dashIndex)
    if (NON_LATIN_ALLOWED_CITIES.has(parentSlug)) return true
  }
  return false
}

const getCustomReplacer = (cityName: string) => {
  return replacers[cityName] || replacers.default
}

const NON_LATIN_ALLOWED_CHARACTERS_PATTERN =
  /[^a-z0-9\u0370-\u03ff\u0400-\u04ff\u0531-\u0587\u10d0-\u10ff\u0600-\u06ff\u0900-\u0dff\u0b80-\u0bff\u0e00-\u0e7f\u1100-\u11ff\u3040-\u30ff\u3100-\u312f\u3130-\u318f\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g

export const normalizeString = (city: string) => {
  const reorderSeparatedSegments = (str: string) => {
    const parts = str.split(/\s*[/-]\s*/)
    if (parts.length <= 1) return str
    const normalizedParts = parts.map((p) => p.trim()).filter(Boolean)
    if (normalizedParts.length <= 1) return str
    const hasMultiWordSegment = normalizedParts.some((p) => p.includes(' '))
    if (!hasMultiWordSegment) return str
    return normalizedParts.sort((a, b) => a.localeCompare(b)).join(' ')
  }

  const normalizeStringBefore = (str?: string) =>
    reorderSeparatedSegments(repairMojibakeString(str || '').toLowerCase())
      .replace(/\u00c5\u201c/g, 'oe')
      .replace(/\u00c3\u00a6/g, 'ae')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()+]/g, ' ')
      .replace(/[\u2010-\u2015]/g, ' ')
      .replace(/[\u02c6-\u02cf\u02d8-\u02dd]/g, '')
      .replace(/[\u0300-\u036F]/g, '')
      .replace(/\u0259/g, 'e')
      .replace(/\u0131/g, 'i')

  const customReplacements = getCustomReplacer(city)

  const normalizeStringAfter = (str?: string) =>
    (str || '')
      .normalize('NFD')
      .replace(
        isNonLatinAllowedCity(city)
          ? NON_LATIN_ALLOWED_CHARACTERS_PATTERN
          : /[^a-z0-9]/g,
        '',
      )
      .replace(/\s+/g, ' ')
      .trim()

  return (str?: string) =>
    normalizeStringAfter(
      stripNumericOrdinalSuffixes(
        canonicalizeFloatingModifiers(
          canonicalizeRoadSuffixes(
            applyCommonAbbreviations(customReplacements(normalizeStringBefore(str))),
          ),
        ),
      ),
    )
}

const formatOrdinalSuffix = (value: number) => {
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) return 'th'
  const mod10 = value % 10
  if (mod10 === 1) return 'st'
  if (mod10 === 2) return 'nd'
  if (mod10 === 3) return 'rd'
  return 'th'
}

export const generateOrdinalNumberAlternates = (value?: string): string[] => {
  const input = repairMojibakeString(value ?? '').trim()
  if (!input) {
    return []
  }

  const alternates = new Set<string>()

  const withoutSuffix = input.replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1')
  if (withoutSuffix !== input) {
    alternates.add(withoutSuffix)
  }

  const withSuffix = input.replace(
    /\b(\d+)\b(?=\s+(?:st|street|av|ave|avenue|rd|road|blvd|boulevard|dr|drive|ct|court|pl|place|sq|square|pkwy|parkway|hwy|highway|ln|lane|ter|terrace|cres|crescent|cir|circle)\b)/gi,
    (_match, digits: string) => `${digits}${formatOrdinalSuffix(Number(digits))}`,
  )
  if (withSuffix !== input) {
    alternates.add(withSuffix)
  }

  return Array.from(alternates)
}
