const fs = require('fs')
const path = require('path')
const { pinyin } = require('pinyin-pro')
const OpenCC = require('opencc-js')

const converter = OpenCC.Converter({ from: 'cn', to: 't' })

const root = __dirname
const geoPath = path.join(root, 'dalian.geojson')
const outFeatures = path.join(root, 'features.json')
const outRoutes = path.join(root, 'routes.json')
const outLines = path.join(root, 'lines.json')

const lineSpecs = [
  { id: 'Line1', name: 'Line 1', color: '#00944B', icon: 'dalian1.png', order: 1, keywords: ['大连地铁1号线'] },
  { id: 'Line2', name: 'Line 2', color: '#009AD8', icon: 'dalian2.png', order: 2, keywords: ['大连地铁2号线'] },
  {
    id: 'Line3',
    name: 'Line 3',
    color: '#DE0079',
    icon: 'dalian3.png',
    order: 3,
    keywords: [
      '大连地铁3号线',
      '大连地铁三号线',
      '大連地鐵3號線',
      '大連地鐵三號線',
      '大连地铁3号线椒金山隧道',
      '九里线',
      '3号线',
      '三号线',
      'Line3',
      'Line 3',
      'line 3',
    ],
  },
  { id: 'Line4', name: 'Line 4', color: '#684E50', icon: 'dalian4.png', order: 4, keywords: ['大连地铁4号线'] },
  { id: 'Line5', name: 'Line 5', color: '#FF0000', icon: 'dalian5.png', order: 5, keywords: ['大连地铁5号线'] },
  { id: 'Line12', name: 'Line 12', color: '#4D4498', icon: 'dalian12.png', order: 12, keywords: ['大连地铁12号线'] },
  { id: 'Line13', name: 'Line 13', color: '#FFE400', icon: 'dalian13.png', order: 13, keywords: ['大连地铁13号线'] },
  { id: 'Tram201', name: 'Tram Route 201', color: '#BBBBBB', icon: 'dalian201.png', order: 201, keywords: ['渡线', '201'] },
  { id: 'Tram202', name: 'Tram Route 202', color: '#BBBBBB', icon: 'dalian202.png', order: 202, keywords: ['202'] },
  { id: 'HaidaCableway', name: 'Haida Cableway', color: '#008080', icon: 'haidacableway.png', order: 301, keywords: ['Haida Cableway'] },
]

const stations = {
  Line1: [
    { en: 'Yaojia', zh: '姚家' },
    { en: 'Dalian North Railway Station', zh: '大连北站' },
    { en: 'Huabei Road', zh: '华北路' },
    { en: "Hua'nan North", zh: '华南北' },
    { en: "Hua'nan Square", zh: '华南广场' },
    { en: 'Qianshan Road', zh: '千山路' },
    { en: 'Songjiang Road', zh: '松江路' },
    { en: 'Dongwei Road', zh: '东纬路' },
    { en: 'Chunliu', zh: '春柳' },
    { en: 'Xianggong Street', zh: '香工街' },
    { en: 'Zhongchang Street', zh: '中长街' },
    { en: 'Xinggong Street', zh: '兴工街' },
    { en: "Xi'an Road", zh: '西安路' },
    { en: 'Fuguo Street', zh: '富国街' },
    { en: 'Convention and Exhibition Center', zh: '会展中心', aliases: ['Convention & Exhibition Center'] },
    { en: 'Xinghai Square', zh: '星海广场' },
    { en: '2nd Hospital of Dalian Medical University', zh: '大医二院', aliases: ['Dalian Medical University Second Affiliated Hospital'] },
    { en: 'Heishijiao', zh: '黑石礁' },
    { en: 'Xueyuan Square', zh: '学苑广场' },
    { en: 'Dalian Maritime University', zh: '海事大学' },
    { en: 'Qixianling', zh: '七贤岭' },
    { en: 'Hekou', zh: '河口' },
  ],
  Line2: [
    { en: 'Dalian North Railway Station', zh: '大连北站' },
    { en: 'Nanguanling', zh: '南关岭' },
    { en: 'Sports Center', zh: '体育中心' },
    { en: 'Health Center', zh: '卫生中心' },
    { en: 'Houge', zh: '后革' },
    { en: 'Gezhenpu', zh: '革镇堡' },
    { en: 'Zhongge', zh: '中革' },
    { en: 'Qiange', zh: '前革' },
    { en: 'Xinzhaizi', zh: '辛寨子' },
    { en: 'Airport', zh: '机场', aliases: ['Dalian Zhoushuizi International Airport', 'DLC'] },
    { en: 'Honggang Road', zh: '虹港路' },
    { en: 'Hongjin Road', zh: '虹锦路' },
    { en: 'Hongqi West Road', zh: '红旗西路' },
    { en: 'Wanjia', zh: '湾家' },
    { en: 'Malan Square', zh: '马栏广场' },
    { en: 'Liaoning Normal University', zh: '辽师大' },
    { en: 'Dalian Jiaotong University', zh: '交通大学' },
    { en: "Xi'an Road", zh: '西安路' },
    { en: 'Lianhe Road', zh: '联合路' },
    { en: 'Renmin Square', zh: '人民广场' },
    { en: "Yi'erjiu Street", zh: '一二九街', aliases: ['Yierjiu Street'] },
    { en: 'Qingniwaqiao', zh: '青泥洼桥' },
    { en: 'Youhao Square', zh: '友好广场' },
    { en: 'Zhongshan Square', zh: '中山广场' },
    { en: 'Gangwan Square', zh: '港湾广场' },
    { en: 'Conference Center', zh: '会议中心' },
    { en: 'Donggang', zh: '东港' },
    { en: 'Donghai', zh: '东海' },
    { en: 'Haizhiyun', zh: '海之韵' },
  ],
  Line3: [
    { en: 'Dalian Railway Station', zh: '大连站' },
    { en: 'Xianglujiao', zh: '香炉礁' },
    { en: 'Jinjia Street', zh: '金家街' },
    { en: 'Quanshui', zh: '泉水' },
    { en: 'Houyan', zh: '后盐' },
    { en: 'Dalianwan', zh: '大连湾' },
    { en: 'Jinma Road', zh: '金马路' },
    { en: 'Dalian Development Area', zh: '开发区' },
    { en: 'Free Trade Zone', zh: '保税区' },
    { en: 'DD Port', zh: '双D港' },
    { en: 'Xiaoyaowan', zh: '小窑湾' },
    { en: 'Golden Pebble Beach', zh: '金石滩' },
    { en: 'Tostem', zh: '通世泰' },
    { en: 'Phoenix Peak', zh: '鸿玮澜山' },
    { en: 'Dongshan Road', zh: '东山路' },
    { en: 'Heping Road', zh: '和平路' },
    { en: 'CR 19th Bureau', zh: '十九局' },
    { en: 'Jiuli', zh: '九里' },
  ],
  Line4: [
    { en: 'Suoyuwan', zh: '梭鱼湾' },
    { en: 'Dongfang Road', zh: '东方路' },
    { en: 'Jinjia Street', zh: '金家街' },
    { en: 'Jinsanjiao', zh: '金三角' },
    { en: 'Songjiang Road', zh: '松江路' },
    { en: 'Xibei Road', zh: '西北路' },
    { en: 'Xinda Street', zh: '新达街' },
    { en: 'Zelong Lake', zh: '泽龙湖' },
    { en: 'University of Technology', zh: '工业大学' },
    { en: 'Xinzhaizi', zh: '辛寨子' },
    { en: 'Xinping Street', zh: '辛萍街' },
    { en: 'Yinxing Avenue', zh: '银杏大道' },
    { en: 'Zhoujiagou', zh: '周家沟' },
    { en: 'Dongnanshan', zh: '东南山' },
    { en: 'Qianmu', zh: '前牧' },
    { en: 'Xingfucun', zh: '幸福村' },
    { en: 'Yingchengzi', zh: '营城子' },
  ],
  Line5: [
    { en: 'Hutan Xinqu', zh: '虎滩新区' },
    { en: 'Tigerbeach Park', zh: '虎滩公园', aliases: ['Hutan Park'] },
    { en: 'Xiuyue Street', zh: '秀月街' },
    { en: 'Taoyuan', zh: '桃源' },
    { en: 'Qingyun Street', zh: '青云街' },
    { en: 'Shikui Road', zh: '石葵路' },
    { en: 'Labor Park', zh: '劳动公园' },
    { en: 'Qingniwaqiao', zh: '青泥洼桥' },
    { en: 'Dalian Railway Station', zh: '大连站' },
    { en: 'Suoyuwan South', zh: '梭鱼湾南' },
    { en: 'Suoyuwan', zh: '梭鱼湾' },
    { en: 'Ganjingzi Street', zh: '甘井子街' },
    { en: 'Ganbei Road', zh: '甘北路' },
    { en: 'Zhonghua East Road', zh: '中华东路' },
    { en: 'Quanshui East', zh: '泉水东' },
    { en: 'Longhua Road', zh: '龙华路' },
    { en: 'Houyan', zh: '后盐' },
    { en: 'Houguan', zh: '后关' },
  ],
  Line12: [
    { en: 'Hekou', zh: '河口' },
    { en: 'Caidaling', zh: '蔡大岭' },
    { en: 'Huangnichuan', zh: '黄泥川' },
    { en: 'Longwangtang', zh: '龙王塘' },
    { en: 'Tahewan', zh: '塔河湾' },
    { en: 'Lüshun', zh: '旅顺' },
    { en: 'Tieshan', zh: '铁山' },
    { en: 'Lüshun New Port', zh: '旅顺新港' },
  ],
  Line13: [
    { en: 'Pulandian Zhenxing Street', zh: '普兰店振兴街' },
    { en: 'Pulandian Development Zone', zh: '普兰店开发区' },
    { en: 'Haiwan High School', zh: '海湾高中' },
    { en: 'The Third Hospital of Dalian Medical University', zh: '大医三院' },
    { en: 'Changdianpu', zh: '长店堡' },
    { en: 'Shihe Beihai', zh: '石河北海' },
    { en: 'Puwan Stadium', zh: '普湾体育场' },
    { en: 'Shihe Huangqi', zh: '石河黄旗' },
    { en: 'Sanshilipu', zh: '三十里堡' },
    { en: 'Ershilipu', zh: '二十里堡' },
    { en: 'Shisanli', zh: '十三里' },
    { en: 'Jiuli', zh: '九里' },
  ],
  Tram201: [
    { en: 'Xinggong Street', zh: '兴工街' },
    { en: 'Zhengong Street', zh: '振工街' },
    { en: 'Wuyi Square', zh: '五一广场' },
    { en: 'Datong Street', zh: '大同街' },
    { en: 'Beijing Street', zh: '北京街' },
    { en: 'Shichang Street', zh: '市场街' },
    { en: 'Dongguan Street', zh: '东关街' },
    { en: 'Dalian Railway Station', zh: '大连火车站' },
    { en: 'Shengli Bridge', zh: '胜利桥' },
    { en: 'Minsheng Street', zh: '民生街' },
    { en: 'Minzhu Square', zh: '民主广场' },
    { en: 'Century Street', zh: '世纪街' },
    { en: 'Sanba Square', zh: '三八广场' },
    { en: 'Erqi Square', zh: '二七广场' },
    { en: 'Siergou', zh: '寺儿沟' },
    { en: 'Chunhai Street', zh: '春海街' },
    { en: 'Hualle Plaza', zh: '华乐广场' },
    { en: 'Haizhiyun Park', zh: '海之韵公园', aliases: ['Haizhiyun Park'] },
  ],
  Tram202: [
    { en: 'Xinggong Street', zh: '兴工街' },
    { en: 'Jinhui Shopping Mall', zh: '锦辉商城' },
    { en: 'Jiefang Square', zh: '解放广场' },
    { en: 'Gongcheng Street', zh: '功成街' },
    { en: 'Heping Square', zh: '和平广场' },
    { en: 'Exhibition Center', zh: '会展中心' },
    { en: 'Xinghai Square', zh: '星海广场' },
    { en: 'Institute of Chemistry', zh: '化物所' },
    { en: 'Dalian Medical University Second Affiliated Hospital', zh: '大医二院' },
    { en: 'Xinghai Park', zh: '星海公园' },
    { en: 'Heishijiao', zh: '黑石礁' },
    { en: 'Xueyuan Plaza Subway Station', zh: '学苑广场地铁站', aliases: ['Xueyuan Square'] },
    { en: 'Maritime University', zh: '海事大学' },
    { en: 'Wanda Plaza', zh: '万达广场' },
    { en: 'Qixianling Subway Station', zh: '七贤岭地铁', aliases: ['Qixianling'] },
    { en: 'Zhongguo Hualu', zh: '中国华录' },
    { en: 'Qixianling', zh: '七贤岭' },
    { en: 'Hekou', zh: '河口' },
    { en: 'Xiaping Daoqian', zh: '小平岛前' },
  ],
  HaidaCableway: [
    { en: 'Senlin Dongwuyuan Nanmen', zh: '森林动物园南门', aliases: ['Forest Zoo South Gate', 'South Gate of Forest Zoo'] },
    { en: 'Lianhua Mountain', zh: '莲花山' },
    { en: 'Baiyun Yanshui', zh: '白云雁水' },
  ],
}

const normalize = (value) => value.replace(/\s+/g, '').toLowerCase()

const flattenPairs = (coords, pairs = []) => {
  if (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number'
  ) {
    pairs.push(coords)
    return pairs
  }
  if (Array.isArray(coords)) {
    coords.forEach((c) => flattenPairs(c, pairs))
  }
  return pairs
}

const getCentroid = (coords) => {
  const pairs = flattenPairs(coords)
  const [sumLon, sumLat] = pairs.reduce(
    (acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat],
    [0, 0],
  )
  return [sumLon / pairs.length, sumLat / pairs.length]
}

const getNames = (properties = {}) => {
  const raw = []
  ;['name', 'name:en', 'name:zh', 'name:zh-hans', 'name:zh-cn'].forEach((k) => {
    const val = properties[k]
    if (val) raw.push(String(val))
  })
  if (properties.name) {
    String(properties.name)
      .split(/[\\/()（）;,]/)
      .forEach((part) => {
        const trimmed = part.trim()
        if (trimmed) raw.push(trimmed)
      })
  }
  return Array.from(new Set(raw))
}

const buildAlternateNames = (spec) => {
  const alts = new Set()
  if (spec.zh) alts.add(spec.zh)
  if (spec.zh) alts.add(converter(spec.zh))
  if (spec.zh) alts.add(pinyin(spec.zh, { toneType: 'mark' }))
  if (spec.aliases) spec.aliases.forEach((a) => alts.add(a))
  alts.delete(spec.en)
  return Array.from(alts)
}

const main = () => {
  const geo = JSON.parse(fs.readFileSync(geoPath, 'utf8'))

  const pointFeatures = geo.features.filter((f) => f.geometry?.type === 'Point')
  const polygonFeatures = geo.features.filter((f) => f.geometry?.type === 'Polygon')

  const indexed = [...pointFeatures, ...polygonFeatures].map((f) => ({
    feature: f,
    names: getNames(f.properties).map((n) => normalize(n)),
  }))

  const findMatches = (candidates) => {
    const normalizedCandidates = candidates.map((c) => normalize(c))
    return indexed.filter((entry) =>
      entry.names.some(
        (name) =>
          normalizedCandidates.includes(name) ||
          normalizedCandidates.some((cand) => name.includes(cand)),
      ),
    )
  }

  const featuresOut = []
  let idCounter = 0
  const missingStations = []

  Object.entries(stations).forEach(([lineId, stops]) => {
    stops.forEach((stop) => {
      const candidates = [stop.en, stop.zh, ...(stop.aliases ?? [])].filter(Boolean)
      const matches = findMatches(candidates)
      if (matches.length === 0) {
        missingStations.push({ line: lineId, station: stop })
        return
      }
      const seenCoords = new Set()
      matches.forEach((match) => {
        const geom = match.feature.geometry
        const coords =
          geom.type === 'Point' ? geom.coordinates : getCentroid(geom.coordinates)

        const key = coords.map((n) => Number(n).toFixed(6)).join(',')
        if (seenCoords.has(key)) return
        seenCoords.add(key)

        featuresOut.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: {
            id: idCounter,
            name: stop.en,
            display_name: stop.zh ? `${stop.en} (${stop.zh})` : stop.en,
            line: lineId,
            alternate_names: buildAlternateNames(stop),
          },
          id: idCounter,
        })
        idCounter += 1
      })
    })
  })

  if (missingStations.length) {
    console.warn('Missing station matches:', JSON.stringify(missingStations, null, 2))
  }

  const routeFeatures = []
  const missingRoutes = []

  lineSpecs.forEach((line) => {
    const coords = []
    geo.features
      .filter(
        (f) =>
          f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString',
      )
      .forEach((f) => {
        const name = String(f.properties?.name ?? '').toLowerCase()
        const matched = line.keywords.some((kw) =>
          name.includes(String(kw).toLowerCase()),
        )
        if (matched) {
          if (f.geometry.type === 'LineString') coords.push(f.geometry.coordinates)
          else coords.push(...f.geometry.coordinates)
        }
      })

    if (coords.length === 0) {
      missingRoutes.push(line.id)
      return
    }

    routeFeatures.push({
      type: 'Feature',
      geometry: { type: 'MultiLineString', coordinates: coords },
      properties: { line: line.id, name: line.name, color: line.color, order: line.order },
    })
  })

  if (missingRoutes.length) {
    console.warn('Missing routes for:', missingRoutes)
  }

  const linesOut = lineSpecs.reduce((acc, line) => {
    acc[line.id] = {
      name: line.name,
      color: line.color,
      backgroundColor: line.color,
      textColor: '#ffffff',
      icon: line.icon,
      order: line.order,
    }
    return acc
  }, {})

  fs.writeFileSync(
    outFeatures,
    JSON.stringify({ type: 'FeatureCollection', features: featuresOut }, null, 2),
  )
  fs.writeFileSync(
    outRoutes,
    JSON.stringify({ type: 'FeatureCollection', features: routeFeatures }, null, 2),
  )
  fs.writeFileSync(outLines, JSON.stringify(linesOut, null, 2))
}

main()
