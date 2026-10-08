const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { PROJECT_ICONS, PROJECT_ICON_LABELS, projectAppearance } = require('./load-source.cjs')()(
  'src/utils/project-appearance.ts'
)
test('project icons map to bundled glyphs and common choices exist', () => {
  const css = fs.readFileSync('src/assets/fonts/iconfont.css', 'utf8')
  const glyphs = new Set([...css.matchAll(/\.(jcon-[\w-]+):before/g)].map((m) => m[1]))
  assert.deepEqual(new Set(PROJECT_ICONS), glyphs)
  for (const icon of Object.keys(PROJECT_ICON_LABELS)) assert.ok(glyphs.has(icon), icon)
})
test('project appearance rejects missing glyphs and invalid colors while retaining valid choices', () => {
  assert.deepEqual(projectAppearance({ icon: 'missing', color: 'red' }), projectAppearance({}))
  const chosen = projectAppearance({ icon: 'jcon-car', color: '#123456' })
  assert.equal(chosen.icon, 'jcon-car')
  assert.equal(chosen.color, '#123456')
  assert.equal(chosen.tint, 'rgba(18, 52, 86, 0.1)')
})
