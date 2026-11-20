const LINE_PREFIX_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^AirTrain JFK\s*[–-]\s*/i, ''],
  [/^AirTrain\s+/i, ''],
  [/^MNRR\s+/i, ''],
  [/^LIRR\s+/i, ''],
  [/^CTrail\s+/i, ''],
  [/^NJT\s+Light\s+Rail\s+/i, ''],
  [/^NJT\s+HBLR\s+/i, ''],
  [/^NJT\s+/i, ''],
]

const SIMPLIFIED_LINE_NAME_OVERRIDES: Record<string, string> = {
  'Mass Transit Railway (MTR)': '港铁（MTR）',
  'Heavy Rail': '重铁',
  'East Rail': '东铁线',
  'Tuen Ma': '屯马线',
  'Northern Link': '北环线',
  'Airport Express': '机场快线',
  'Disneyland Resort': '迪士尼线',
  'Disney Resort': '迪士尼线',
  'Island Line': '港岛线',
  Island: '港岛线',
  'Kwun Tong Line': '观塘线',
  'Kwun Tong': '观塘线',
  'Tseung Kwan O Line': '将军澳线',
  'Tseung Kwan O': '将军澳线',
  'Tung Chung Line': '东涌线',
  'Tung Chung': '东涌线',
  'Tsuen Wan Line': '荃湾线',
  'Tsuen Wan': '荃湾线',
  'South Island Line': '南港岛线',
  'South Island': '南港岛线',
  'Express Rail Link': '高速铁路',
  'Zhujiang New Town Automated People Mover System': '珠江新城旅客自动输送系统',
  'Huangpu Tram Line 1': '黄埔有轨电车1号线',
  'Huangpu Tram Line 2': '黄埔有轨电车2号线',
  'Haizhu Tram Line 1': '海珠有轨电车1号线',
  Guangfo: '广佛线',
  'Nanhai Tram Line 1': '南海有轨电车1号线',
  'Shenzhen Airport APM': '深圳机场旅客自动输送系统',
  'Hong Kong Tramways': '香港电车',
  'Peak Tram': '山顶缆车',
  'Ocean Express': '海洋列车',
  'Ocean Park Gondola': '海洋公园登山缆车',
  'T1 Line': '1号航站楼线',
  'T2 Line': '2号航站楼线',
  'SkyPier Line': '海天码头线',
  Taipa: '氹仔线',
  Hengqin: '横琴线',
  'Seac Pai Van': '石排湾线',
  East: '东线',
  'Wynn Palace Skycab': '永利皇宫缆车',
  'Guia Hill Cable Car': '东望洋山缆车',
  'Taipa Grande Hill Inclined Lift': '大潭山斜行升降机',
  Guangzhu: '广珠城际',
  Suishen: '穗深城际',
  Zhuji: '珠机城际',
  Guanghui: '广惠城际',
  Guangzhao: '广肇城际',
  Guangqing: '广清城际',
  'Guangfo Ring': '广佛环线',
  Guangshen: '广深城际',
  Shenshan: '深汕城际',
  'Qingyuan Maglev Tourist Line': '清远磁浮旅游专线',
  'Safari Park Cable Car': '长隆野生动物世界缆车',
  'Baiyun Mountain Cableway': '白云山索道',
  'Sam Shing — Siu Hong': '三圣—兆康',
  'Tuen Mun Ferry Pier — Tin King': '屯门码头—田景',
  'Tuen Mun Ferry Pier — Yuen Long': '屯门码头—元朗',
  'Tuen Mun Ferry Pier — Siu Hong': '屯门码头—兆康',
  'Tin Shui Wai — Counterclockwise': '天水围循环线（逆时针）',
  'Tin Shui Wai — Clockwise': '天水围循环线（顺时针）',
  'Yau Oi — Tin Yat': '友爱—天逸',
  'Tin Shui Wai — Tin Yat': '天水围—天逸',
  'Yuen Long — Tin Yat': '元朗—天逸',
}

// Tokyo's lines in the Japanese interface.
const JAPANESE_LINE_NAME_OVERRIDES: Record<string, string> = {
  'Marunouchi Line': '丸ノ内線',
  'Marunouchi Branch Line': '丸ノ内線支線',
  'Fukutoshin Line': '副都心線',
  'Chiyoda Line': '千代田線',
  'Hanzomon Line': '半蔵門線',
  'Namboku Line': '南北線',
  'Hibiya Line': '日比谷線',
  'Yurakucho Line': '有楽町線',
  'Tozai Line': '東西線',
  'Ginza Line': '銀座線',
  'Mita Line': '三田線',
  'Oedo Line': '大江戸線',
  'Shinjuku Line': '新宿線',
  'Asakusa Line': '浅草線',
}

// Seoul's lines in the Korean interface ("Line N" becomes "N호선" there).
const KOREAN_LINE_NAME_OVERRIDES: Record<string, string> = {
  'Gyeonggang Line': '경강선',
  'Gyeongui–Jungang Line': '경의중앙선',
  'Gyeongchun Line': '경춘선',
  'AREX': '공항철도',
  'Suin–Bundang Line': '수인분당선',
  'Shinbundang Line': '신분당선',
  'Incheon Line 1': '인천1호선',
  'Incheon Line 2': '인천2호선',
  'Gimpo Goldline': '김포골드라인',
  'Seohae Line': '서해선',
  'Sillim Line': '신림선',
  'Yongin EverLine': '에버라인',
  'Ui–Sinseol Line': '우이신설경전철',
  'Uijeongbu LRT': '의정부경전철',
}

const TRADITIONAL_LINE_NAME_OVERRIDES: Record<string, string> = {
  'Mass Transit Railway (MTR)': '港鐵（MTR）',
  'Heavy Rail': '重鐵',
  'East Rail': '東鐵綫',
  'Tuen Ma': '屯馬綫',
  'Northern Link': '北環綫',
  'Airport Express': '機場快綫',
  'Disneyland Resort': '迪士尼綫',
  'Disney Resort': '迪士尼綫',
  'Island Line': '港島綫',
  Island: '港島綫',
  'Kwun Tong Line': '觀塘綫',
  'Kwun Tong': '觀塘綫',
  'Tseung Kwan O Line': '將軍澳綫',
  'Tseung Kwan O': '將軍澳綫',
  'Tung Chung Line': '東涌綫',
  'Tung Chung': '東涌綫',
  'Tsuen Wan Line': '荃灣綫',
  'Tsuen Wan': '荃灣綫',
  'South Island Line': '南港島綫',
  'South Island': '南港島綫',
  'Express Rail Link': '高速鐵路',
  'Zhujiang New Town Automated People Mover System': '珠江新城旅客自動輸送系統',
  'Huangpu Tram Line 1': '黃埔有軌電車1號線',
  'Huangpu Tram Line 2': '黃埔有軌電車2號線',
  'Haizhu Tram Line 1': '海珠有軌電車1號線',
  Guangfo: '廣佛線',
  'Nanhai Tram Line 1': '南海有軌電車1號線',
  'Shenzhen Airport APM': '深圳機場旅客自動輸送系統',
  'Hong Kong Tramways': '香港電車',
  'Peak Tram': '山頂纜車',
  'Ocean Express': '海洋列車',
  'Ocean Park Gondola': '海洋公園登山纜車',
  'T1 Line': '1號航站樓線',
  'T2 Line': '2號航站樓線',
  'SkyPier Line': '海天碼頭線',
  Taipa: '氹仔線',
  Hengqin: '橫琴線',
  'Seac Pai Van': '石排灣線',
  East: '東線',
  'Wynn Palace Skycab': '永利皇宮纜車',
  'Guia Hill Cable Car': '東望洋山纜車',
  'Taipa Grande Hill Inclined Lift': '大潭山斜行升降機',
  Guangzhu: '廣珠城際',
  Suishen: '穗深城際',
  Zhuji: '珠機城際',
  Guanghui: '廣惠城際',
  Guangzhao: '廣肇城際',
  Guangqing: '廣清城際',
  'Guangfo Ring': '廣佛環線',
  Guangshen: '廣深城際',
  Shenshan: '深汕城際',
  'Qingyuan Maglev Tourist Line': '清遠磁浮旅遊專線',
  'Safari Park Cable Car': '長隆野生動物世界纜車',
  'Baiyun Mountain Cableway': '白雲山索道',
  'Sam Shing — Siu Hong': '三聖—兆康',
  'Tuen Mun Ferry Pier — Tin King': '屯門碼頭—田景',
  'Tuen Mun Ferry Pier — Yuen Long': '屯門碼頭—元朗',
  'Tuen Mun Ferry Pier — Siu Hong': '屯門碼頭—兆康',
  'Tin Shui Wai — Counterclockwise': '天水圍循環線（逆時針）',
  'Tin Shui Wai — Clockwise': '天水圍循環線（順時針）',
  'Yau Oi — Tin Yat': '友愛—天逸',
  'Tin Shui Wai — Tin Yat': '天水圍—天逸',
  'Yuen Long — Tin Yat': '元朗—天逸',
}

export const cleanupLineName = (name?: string) => {
  if (!name) return ''

  let result = name.replace(/L[Ii]ne/g, 'Line')

  for (const [pattern, replacement] of LINE_PREFIX_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }

  return result.replace(/^[–-]\s*/, '').replace(/\s{2,}/g, ' ').trim()
}

export const formatLocalizedLineName = (
  name: string | undefined,
  language?: string,
) => {
  const cleaned = cleanupLineName(name)
  if (!cleaned) {
    return ''
  }

  if (language === 'zh-CN') {
    if (SIMPLIFIED_LINE_NAME_OVERRIDES[cleaned]) {
      return SIMPLIFIED_LINE_NAME_OVERRIDES[cleaned]
    }
    return cleaned.replace(/^Line\s+(.+)$/i, '$1号线')
  }

  if (language === 'ja') {
    if (JAPANESE_LINE_NAME_OVERRIDES[cleaned]) {
      return JAPANESE_LINE_NAME_OVERRIDES[cleaned]
    }
    return cleaned.replace(/^Line\s+(.+)$/i, '$1号線')
  }

  if (language === 'fr') {
    return cleaned.replace(/^Line\s+(.+)$/i, 'Ligne $1')
  }

  if (language === 'es' || language === 'ca') {
    return cleaned.replace(/^Line\s+(.+)$/i, language === 'es' ? 'Línea $1' : 'Línia $1')
  }

  if (language === 'ko') {
    if (KOREAN_LINE_NAME_OVERRIDES[cleaned]) {
      return KOREAN_LINE_NAME_OVERRIDES[cleaned]
    }
    return cleaned.replace(/^Line\s+(\d+)$/i, '$1호선')
  }

  if (language === 'zh-TW') {
    if (TRADITIONAL_LINE_NAME_OVERRIDES[cleaned]) {
      return TRADITIONAL_LINE_NAME_OVERRIDES[cleaned]
    }
    return cleaned.replace(/^Line\s+(.+)$/i, '$1號線')
  }

  return cleaned
}
