const normalizeHex = (value: string) => {
  const hex = value.trim().replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return hex
  }

  return null
}

const hexToRgb = (value?: string): [number, number, number] | null => {
  if (!value) {
    return null
  }

  const hex = normalizeHex(value)
  if (!hex) {
    return null
  }

  const int = parseInt(hex, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

const srgbChannel = (value: number) => {
  const normalized = value / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4)
}

export const getRelativeLuminance = (value?: string) => {
  const rgb = hexToRgb(value)
  if (!rgb) {
    return null
  }

  const [r, g, b] = rgb.map(srgbChannel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Yellow-ish line colours (yellow, gold, pale lime-yellow). A progress ring in
 * one of these is almost invisible on a white or yellow background.
 */
export const isYellowColor = (value?: string) => {
  const rgb = hexToRgb(value)
  if (!rgb) {
    return false
  }

  const [r, g, b] = rgb.map((channel) => channel / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2
  if (delta === 0) {
    return false
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue: number
  if (max === r) {
    hue = 60 * (((g - b) / delta) % 6)
  } else if (max === g) {
    hue = 60 * ((b - r) / delta + 2)
  } else {
    hue = 60 * ((r - g) / delta + 4)
  }
  if (hue < 0) hue += 360

  return hue >= 42 && hue <= 72 && saturation >= 0.45 && lightness >= 0.4 && lightness <= 0.9
}

/** Colour used in dark mode in place of a near-black line colour. */
export const NEAR_BLACK_DARK_MODE_COLOR = '#D4D4D8'

/** Black or almost black: invisible on a dark background. */
export const isColorNearBlack = (value?: string, threshold = 0.02) => {
  const luminance = getRelativeLuminance(value)
  return luminance !== null && luminance < threshold
}

export const isColorLight = (value?: string, threshold = 0.82) => {
  const luminance = getRelativeLuminance(value)
  if (luminance === null) {
    return false
  }

  return luminance >= threshold
}

export const pickVisibleColor = (
  primary?: string,
  fallback?: string,
  threshold = 0.82,
  defaultColor = '#4f46e5',
) => {
  if (primary && !isColorLight(primary, threshold)) {
    return primary
  }

  if (fallback && !isColorLight(fallback, threshold)) {
    return fallback
  }

  return primary ?? fallback ?? defaultColor
}
