import { getCountryCodeFromSlug } from '@/lib/countryFlags'

const SIMPLIFIED_COUNTRY_NAMES: Record<string, string> = {
  unknown: '未知',
  global: '主要',
  'secret-fun': '隐藏与趣味',
  usa: '美国',
  canada: '加拿大',
  mexico: '墨西哥',
  uk: '英国',
  uae: '阿联酋',
  'south-korea': '韩国',
  'north-korea': '朝鲜',
  'new-zealand': '新西兰',
  ireland: '爱尔兰',
  france: '法国',
  germany: '德国',
  spain: '西班牙',
  italy: '意大利',
  austria: '奥地利',
  sweden: '瑞典',
  hungary: '匈牙利',
  turkey: '土耳其',
  australia: '澳大利亚',
  china: '中国',
  japan: '日本',
  singapore: '新加坡',
  taiwan: '台湾',
  malaysia: '马来西亚',
  indonesia: '印度尼西亚',
  vietnam: '越南',
  thailand: '泰国',
  philippines: '菲律宾',
  'united-arab-emirates': '阿拉伯联合酋长国',
  argentina: '阿根廷',
  venezuela: '委内瑞拉',
  brazil: '巴西',
  'south-africa': '南非',
  algeria: '阿尔及利亚',
}

const TRADITIONAL_COUNTRY_NAMES: Record<string, string> = {
  unknown: '未知',
  global: '主要',
  'secret-fun': '隱藏與趣味',
  usa: '美國',
  canada: '加拿大',
  mexico: '墨西哥',
  uk: '英國',
  uae: '阿聯酋',
  'south-korea': '韓國',
  'north-korea': '朝鮮',
  'new-zealand': '紐西蘭',
  ireland: '愛爾蘭',
  france: '法國',
  germany: '德國',
  spain: '西班牙',
  italy: '義大利',
  austria: '奧地利',
  sweden: '瑞典',
  hungary: '匈牙利',
  turkey: '土耳其',
  australia: '澳洲',
  china: '中國',
  japan: '日本',
  singapore: '新加坡',
  taiwan: '台灣',
  malaysia: '馬來西亞',
  indonesia: '印尼',
  vietnam: '越南',
  thailand: '泰國',
  philippines: '菲律賓',
  'united-arab-emirates': '阿拉伯聯合酋長國',
  argentina: '阿根廷',
  venezuela: '委內瑞拉',
  brazil: '巴西',
  'south-africa': '南非',
  algeria: '阿爾及利亞',
}

export const formatDisplayCountryLabel = (slug: string | null, language?: string) => {
  if (!slug) {
    return language === 'zh-CN' || language === 'zh-TW' ? '未知' : 'Unknown'
  }
  if (language === 'zh-CN' && SIMPLIFIED_COUNTRY_NAMES[slug]) {
    return SIMPLIFIED_COUNTRY_NAMES[slug]
  }
  if (language === 'zh-TW' && TRADITIONAL_COUNTRY_NAMES[slug]) {
    return TRADITIONAL_COUNTRY_NAMES[slug]
  }
  // Every other country, in every non-English language, from the browser's
  // own country-name data (so new countries are translated automatically).
  if (language && language !== 'en') {
    const code = getCountryCodeFromSlug(slug)
    if (code) {
      try {
        const locale =
          language === 'zh-CN' ? 'zh-Hans' : language === 'zh-TW' ? 'zh-Hant' : language
        const name = new Intl.DisplayNames([locale], { type: 'region' }).of(code)
        if (name && name !== code) return name
      } catch {
        // older browsers: fall back to the English label
      }
    }
  }
  return null
}
