import { formatLocalizedCityName } from '@/lib/cityNameDisplay'

type AchievementDisplayInput = {
  slug: string
  cityName: string
  title: string
  description: string
  secretDescription?: string
}

type AchievementDisplayOutput = {
  cityName: string
  title: string
  description: string
  secretDescription?: string
}

type AchievementCopy = {
  title: string
  description: string
  secretDescription?: string
}

const SIMPLIFIED_GLOBAL_COPY: Record<string, AchievementCopy> = {
  'almost-flawless': {
    title: '近乎完美',
    description: '以两次或更少失误完成任意城市。',
  },
  'comeback-kid': {
    title: '逆转高手',
    description: '从低于 50% 的进度追回并完成一座城市。',
  },
  'explorer-10': {
    title: '探索者',
    description: '完成 10 座不同城市。',
  },
  'explorer-50': {
    title: '终极探索者',
    description: '完成 50 座不同城市。',
  },
  'twin-city': {
    title: '双城记',
    description: '在同一天完成两座来自不同洲的城市。',
  },
  'big-city-tamer': {
    title: '大城驯服者',
    description: '完成一座拥有 1,500+ 车站的城市。',
  },
  marathoner: {
    title: '马拉松选手',
    description: '在所有城市中找到 100,000 座车站。',
  },
  'typo-free': {
    title: '零错字',
    description: '不使用退格键或删除键完成一座城市。',
  },
  'perfect-start': {
    title: '完美开局',
    description: '在一座城市开局连续猜对 25 站。',
  },
  'never-repeat': {
    title: '不重不漏',
    description: '完成一座城市且不重复猜测已找到的车站。',
  },
  underdog: {
    title: '以小博大',
    description: '完成一座少于 20 座车站的城市。',
  },
  'golden-ratio': {
    title: '黄金分割',
    description: '???',
    secretDescription: '在任意城市达到 61.8% 完成度。',
  },
  'the-archivist': {
    title: '档案管理员',
    description: '???',
    secretDescription: '打开 10 座不同城市的统计面板。',
  },
  'explorer-100': {
    title: '百城探索者',
    description: '完成 100 座不同城市。',
  },
  'spotless-record': {
    title: '无瑕记录',
    description: '零失误完成 5 座不同城市。',
  },
  'hot-streak': {
    title: '手感火热',
    description: '连续猜对 50 次。',
  },
  'night-owl': {
    title: '夜猫子',
    description: '???',
    secretDescription: '在午夜至凌晨 4 点之间找到一座车站。',
  },
  'early-bird': {
    title: '早起的鸟儿',
    description: '???',
    secretDescription: '在早上 5 点至 7 点之间找到一座车站。',
  },
  'slice-of-pi': {
    title: '一块圆周率',
    description: '???',
    secretDescription: '在任意城市达到 31.4% 完成度。',
  },
  'halfway-there': {
    title: '恰好一半',
    description: '???',
    secretDescription: '在任意城市恰好达到 50% 完成度。',
  },
  'butterfingers': {
    title: '手滑了',
    description: '???',
    secretDescription: '连续猜错 10 次。',
  },
  'deja-vu': {
    title: '似曾相识',
    description: '???',
    secretDescription: '连续 5 次猜测已找到的车站。',
  },
  'mystery-ticket': {
    title: '神秘车票',
    description: '???',
    secretDescription: '使用「随机游玩城市」5 次。',
  },
  'unlucky-line': {
    title: '不祥之线',
    description: '???',
    secretDescription: '在 13 号星期五找到一座车站。',
  },
  'first-train-of-the-year': {
    title: '新年头班车',
    description: '???',
    secretDescription: '在元旦找到一座车站。',
  },
  'metro-memory-master': {
    title: '终极完成者',
    description: '解锁所有城市成就即可获得这枚最终徽章。',
  },
}

const TRADITIONAL_GLOBAL_COPY: Record<string, AchievementCopy> = {
  'almost-flawless': {
    title: '近乎完美',
    description: '以兩次或更少失誤完成任意城市。',
  },
  'comeback-kid': {
    title: '逆轉高手',
    description: '從低於 50% 的進度追回並完成一座城市。',
  },
  'explorer-10': {
    title: '探索者',
    description: '完成 10 座不同城市。',
  },
  'explorer-50': {
    title: '終極探索者',
    description: '完成 50 座不同城市。',
  },
  'twin-city': {
    title: '雙城記',
    description: '在同一天完成兩座來自不同洲的城市。',
  },
  'big-city-tamer': {
    title: '大城馴服者',
    description: '完成一座擁有 1,500+ 車站的城市。',
  },
  marathoner: {
    title: '馬拉松選手',
    description: '在所有城市中找到 100,000 座車站。',
  },
  'typo-free': {
    title: '零錯字',
    description: '不使用退格鍵或刪除鍵完成一座城市。',
  },
  'perfect-start': {
    title: '完美開局',
    description: '在一座城市開局連續猜對 25 站。',
  },
  'never-repeat': {
    title: '不重不漏',
    description: '完成一座城市且不重複猜測已找到的車站。',
  },
  underdog: {
    title: '以小博大',
    description: '完成一座少於 20 座車站的城市。',
  },
  'golden-ratio': {
    title: '黃金分割',
    description: '???',
    secretDescription: '在任意城市達到 61.8% 完成度。',
  },
  'the-archivist': {
    title: '檔案管理員',
    description: '???',
    secretDescription: '開啟 10 座不同城市的統計面板。',
  },
  'explorer-100': {
    title: '百城探索者',
    description: '完成 100 座不同城市。',
  },
  'spotless-record': {
    title: '無瑕紀錄',
    description: '零失誤完成 5 座不同城市。',
  },
  'hot-streak': {
    title: '手感火熱',
    description: '連續猜對 50 次。',
  },
  'night-owl': {
    title: '夜貓子',
    description: '???',
    secretDescription: '在午夜至凌晨 4 點之間找到一座車站。',
  },
  'early-bird': {
    title: '早起的鳥兒',
    description: '???',
    secretDescription: '在早上 5 點至 7 點之間找到一座車站。',
  },
  'slice-of-pi': {
    title: '一塊圓周率',
    description: '???',
    secretDescription: '在任意城市達到 31.4% 完成度。',
  },
  'halfway-there': {
    title: '恰好一半',
    description: '???',
    secretDescription: '在任意城市恰好達到 50% 完成度。',
  },
  'butterfingers': {
    title: '手滑了',
    description: '???',
    secretDescription: '連續猜錯 10 次。',
  },
  'deja-vu': {
    title: '似曾相識',
    description: '???',
    secretDescription: '連續 5 次猜測已找到的車站。',
  },
  'mystery-ticket': {
    title: '神秘車票',
    description: '???',
    secretDescription: '使用「隨機遊玩城市」5 次。',
  },
  'unlucky-line': {
    title: '不祥之線',
    description: '???',
    secretDescription: '在 13 號星期五找到一座車站。',
  },
  'first-train-of-the-year': {
    title: '新年頭班車',
    description: '???',
    secretDescription: '在元旦找到一座車站。',
  },
  'metro-memory-master': {
    title: '終極完成者',
    description: '解鎖所有城市成就即可獲得這枚最終徽章。',
  },
}

const isSimplifiedChinese = (language?: string) => language === 'zh-CN'
const isTraditionalChinese = (language?: string) => language === 'zh-TW'

export const formatAchievementDisplayMeta = (
  meta: AchievementDisplayInput,
  language?: string,
): AchievementDisplayOutput => {
  const localizedCityName = formatLocalizedCityName(meta.cityName, meta.slug, language)
  if (!isSimplifiedChinese(language) && !isTraditionalChinese(language)) {
    return {
      cityName: localizedCityName,
      title: meta.title,
      description: meta.description,
      secretDescription: meta.secretDescription,
    }
  }

  const overrides = isSimplifiedChinese(language)
    ? SIMPLIFIED_GLOBAL_COPY
    : TRADITIONAL_GLOBAL_COPY
  const override = overrides[meta.slug]
  if (override) {
    return {
      cityName: localizedCityName,
      title: override.title,
      description: override.description,
      secretDescription: override.secretDescription,
    }
  }

  const genericTitle = `${meta.cityName} Completionist`
  const genericDescription = `You found every station in ${meta.cityName}!`
  if (meta.title === genericTitle && meta.description === genericDescription) {
    return {
      cityName: localizedCityName,
      title: isSimplifiedChinese(language)
        ? `${localizedCityName} 全站制霸`
        : `${localizedCityName} 全站制霸`,
      description: isSimplifiedChinese(language)
        ? `你找到了 ${localizedCityName} 的每一座车站！`
        : `你找到了 ${localizedCityName} 的每一座車站！`,
    }
  }

  return {
    cityName: localizedCityName,
    title: meta.title,
    description: meta.description,
    secretDescription: meta.secretDescription,
  }
}
