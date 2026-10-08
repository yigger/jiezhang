const fs = require('node:fs')
const path = require('node:path')
const babel = require('@babel/core')
const root = path.resolve(__dirname, '..')

module.exports = function createLoader(mocks = {}) {
  const cache = new Map()
  function load(filename) {
    filename = path.resolve(root, filename)
    if (Object.hasOwn(mocks, filename)) return mocks[filename]
    if (cache.has(filename)) return cache.get(filename).exports
    const module = { exports: {} }
    cache.set(filename, module)
    const { code } = babel.transformFileSync(filename, {
      plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')]
    })
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier]
      // Styles have no runtime behavior in source-level JavaScript tests.
      if (/\.(css|scss|styl)$/.test(specifier)) return {}
      let target
      if (specifier === '@/jz') target = path.join(root, 'src/jz')
      else if (specifier.startsWith('@/src/')) target = path.join(root, specifier.slice(2))
      else if (specifier.startsWith('@/')) target = path.join(root, 'src', specifier.slice(2))
      else if (specifier.startsWith('.')) target = path.resolve(path.dirname(filename), specifier)
      else return require(specifier)
      const resolved = [
        target,
        target + '.ts',
        target + '.tsx',
        path.join(target, 'index.ts')
      ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile())
      if (!resolved) throw new Error(`Cannot resolve ${specifier}`)
      return load(resolved)
    }
    new Function('require', 'module', 'exports', code)(localRequire, module, module.exports)
    return module.exports
  }
  return load
}
