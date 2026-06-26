import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const DEFAULT_BG = { r: 11, g: 15, b: 20, alpha: 1 }
const PANEL_BG = '#0b0f14'
const PANEL_BORDER = '#1f2a37'
const TITLE_COLOR = '#dbe7ff'
const SUBTITLE_COLOR = '#6b7a90'

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function rgbaToCss({ r, g, b, a = 1 }) {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

async function rasterize(svgBuffer, width, height) {
  return sharp(svgBuffer)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
}

function getPixel(buffer, info, x, y) {
  const idx = (y * info.width + x) * info.channels
  return {
    r: buffer[idx] ?? 0,
    g: buffer[idx + 1] ?? 0,
    b: buffer[idx + 2] ?? 0,
    a: ((buffer[idx + 3] ?? 0) / 255),
  }
}

function mixPixel(top, bottom) {
  const total = top.a + bottom.a
  if (total <= 0.01) return { ...DEFAULT_BG, a: 0 }
  return {
    r: Math.round((top.r * top.a + bottom.r * bottom.a) / total),
    g: Math.round((top.g * top.a + bottom.g * bottom.a) / total),
    b: Math.round((top.b * top.a + bottom.b * bottom.a) / total),
    a: Math.min(1, total / 2 || 1),
  }
}

function alphaLuma(px) {
  const luma = 0.2126 * px.r + 0.7152 * px.g + 0.0722 * px.b
  return (luma / 255) * px.a
}

function buildFullBlockGrid(buffer, info) {
  const rows = []
  for (let y = 0; y < info.height; y++) {
    const row = []
    for (let x = 0; x < info.width; x++) {
      const px = getPixel(buffer, info, x, y)
      if (px.a < 0.08) {
        row.push({ char: ' ', fg: null, bg: null })
      } else {
        row.push({ char: '█', fg: px, bg: null })
      }
    }
    rows.push(row)
  }
  return rows
}

function buildHalfBlockGrid(buffer, info) {
  const rows = []
  for (let y = 0; y < info.height; y += 2) {
    const row = []
    for (let x = 0; x < info.width; x++) {
      const top = getPixel(buffer, info, x, y)
      const bottom = y + 1 < info.height ? getPixel(buffer, info, x, y + 1) : { ...DEFAULT_BG, a: 0 }
      if (top.a < 0.08 && bottom.a < 0.08) {
        row.push({ char: ' ', fg: null, bg: null })
        continue
      }
      row.push({
        char: '▀',
        fg: top.a < 0.08 ? DEFAULT_BG : top,
        bg: bottom.a < 0.08 ? null : bottom,
      })
    }
    rows.push(row)
  }
  return rows
}

function buildShadeGrid(buffer, info) {
  const palette = [' ', '░', '▒', '▓', '█']
  const rows = []
  for (let y = 0; y < info.height; y++) {
    const row = []
    for (let x = 0; x < info.width; x++) {
      const px = getPixel(buffer, info, x, y)
      const value = alphaLuma(px)
      const index = value <= 0.05 ? 0 : value <= 0.22 ? 1 : value <= 0.45 ? 2 : value <= 0.7 ? 3 : 4
      const char = palette[index]
      row.push({
        char,
        fg: char === ' ' ? null : px,
        bg: null,
      })
    }
    rows.push(row)
  }
  return rows
}

function buildBrailleGrid(buffer, info) {
  const rows = []
  for (let y = 0; y < info.height; y += 4) {
    const row = []
    for (let x = 0; x < info.width; x += 2) {
      let bits = 0
      let rs = 0
      let gs = 0
      let bs = 0
      let count = 0
      const coords = [
        [0, 0, 1],
        [0, 1, 2],
        [0, 2, 4],
        [1, 0, 8],
        [1, 1, 16],
        [1, 2, 32],
        [0, 3, 64],
        [1, 3, 128],
      ]
      for (const [dx, dy, bit] of coords) {
        const px = x + dx < info.width && y + dy < info.height
          ? getPixel(buffer, info, x + dx, y + dy)
          : { ...DEFAULT_BG, a: 0 }
        if (alphaLuma(px) > 0.18) {
          bits |= bit
          rs += px.r
          gs += px.g
          bs += px.b
          count++
        }
      }
      if (bits === 0) {
        row.push({ char: ' ', fg: null, bg: null })
      } else {
        row.push({
          char: String.fromCodePoint(0x2800 + bits),
          fg: {
            r: Math.round(rs / count),
            g: Math.round(gs / count),
            b: Math.round(bs / count),
            a: 1,
          },
          bg: null,
        })
      }
    }
    rows.push(row)
  }
  return rows
}

async function renderGridPanel({ title, subtitle, grid, cellWidth, lineHeight, fontSize }) {
  const cols = Math.max(...grid.map(row => row.length))
  const width = 40 + cols * cellWidth
  const height = 66 + grid.length * lineHeight + 24
  let body = ''
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x]
      const cx = 20 + x * cellWidth
      const cy = 62 + y * lineHeight
      if (cell.bg) {
        body += `<rect x="${cx}" y="${cy}" width="${cellWidth}" height="${lineHeight}" fill="${rgbaToCss(cell.bg)}" />`
      }
      if (cell.char !== ' ') {
        body += `<text x="${cx}" y="${cy + fontSize}" fill="${rgbaToCss(cell.fg)}" font-family="Consolas, 'Cascadia Mono', monospace" font-size="${fontSize}">${escapeXml(cell.char)}</text>`
      }
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="18" fill="${PANEL_BG}" stroke="${PANEL_BORDER}" />
  <text x="20" y="28" fill="${TITLE_COLOR}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">${escapeXml(title)}</text>
  <text x="20" y="46" fill="${SUBTITLE_COLOR}" font-family="Segoe UI, Arial, sans-serif" font-size="12">${escapeXml(subtitle)}</text>
  ${body}
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function renderReferencePanel(svgBuffer) {
  const width = 320
  const height = 240
  const logo = await sharp(svgBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const panel = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: PANEL_BG,
    },
  })

  const border = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="18" fill="${PANEL_BG}" stroke="${PANEL_BORDER}" />
  <text x="20" y="28" fill="${TITLE_COLOR}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">Reference</text>
  <text x="20" y="46" fill="${SUBTITLE_COLOR}" font-family="Segoe UI, Arial, sans-serif" font-size="12">Original SVG rasterized</text>
</svg>`)

  return panel
    .composite([
      { input: border },
      { input: logo, left: 70, top: 56 },
    ])
    .png()
    .toBuffer()
}

async function createContactSheet(outputFile, panels) {
  const metas = await Promise.all(panels.map(async panel => ({ panel, meta: await sharp(panel).metadata() })))
  const gap = 20
  const padding = 24
  const width = metas.reduce((sum, item) => sum + item.meta.width, padding * 2 + gap * (metas.length - 1))
  const height = Math.max(...metas.map(item => item.meta.height)) + padding * 2
  let left = padding
  const composite = metas.map(item => {
    const current = { input: item.panel, left, top: padding }
    left += item.meta.width + gap
    return current
  })

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#05080c',
    },
  })
    .composite(composite)
    .png()
    .toFile(outputFile)
}

async function main() {
  const svgPath = process.argv[2] || 'd:\\dy\\deepseek-color.svg'
  const outputDir = path.resolve('d:\\dy\\claude-code\\.artifacts\\svg-terminal-preview')
  await fs.mkdir(outputDir, { recursive: true })
  const svgBuffer = await fs.readFile(svgPath)

  const blockRaster = await rasterize(svgBuffer, 28, 20)
  const halfRaster = await rasterize(svgBuffer, 34, 24)
  const brailleRaster = await rasterize(svgBuffer, 28, 28)
  const shadeRaster = await rasterize(svgBuffer, 26, 18)

  const reference = await renderReferencePanel(svgBuffer)
  const fullBlock = await renderGridPanel({
    title: 'Full Block',
    subtitle: '1 pixel -> 1 cell',
    grid: buildFullBlockGrid(blockRaster.data, blockRaster.info),
    cellWidth: 9,
    lineHeight: 13,
    fontSize: 13,
  })
  const halfBlock = await renderGridPanel({
    title: 'Half Block',
    subtitle: '2 vertical pixels -> 1 cell',
    grid: buildHalfBlockGrid(halfRaster.data, halfRaster.info),
    cellWidth: 9,
    lineHeight: 13,
    fontSize: 13,
  })
  const shade = await renderGridPanel({
    title: 'Shade Map',
    subtitle: 'brightness -> ░▒▓█',
    grid: buildShadeGrid(shadeRaster.data, shadeRaster.info),
    cellWidth: 9,
    lineHeight: 13,
    fontSize: 13,
  })
  const braille = await renderGridPanel({
    title: 'Braille',
    subtitle: '2x4 pixels -> 1 braille cell',
    grid: buildBrailleGrid(brailleRaster.data, brailleRaster.info),
    cellWidth: 10,
    lineHeight: 15,
    fontSize: 15,
  })

  await fs.writeFile(path.join(outputDir, 'reference.png'), reference)
  await fs.writeFile(path.join(outputDir, 'full-block.png'), fullBlock)
  await fs.writeFile(path.join(outputDir, 'half-block.png'), halfBlock)
  await fs.writeFile(path.join(outputDir, 'shade-map.png'), shade)
  await fs.writeFile(path.join(outputDir, 'braille.png'), braille)

  await createContactSheet(path.join(outputDir, 'comparison.png'), [
    reference,
    fullBlock,
    halfBlock,
    shade,
    braille,
  ])

  console.log(`Saved previews to ${outputDir}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
