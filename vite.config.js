import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadContent } from './src/core/loadContent.js'
import { validateProfile, validateWorks } from './src/core/validate.js'
import { renderClassic } from './src/classic/renderClassic.js'

const root = dirname(fileURLToPath(import.meta.url))

function classicBake() {
  return {
    name: 'classic-bake',
    transformIndexHtml(html) {
      const content = loadContent(join(root, 'content'))
      const errs = [...validateProfile(content.profile), ...validateWorks(content.works)]
      if (errs.length) throw new Error('Content invalid:\n' + errs.join('\n'))
      const css = readFileSync(join(root, 'src/classic/classic.css'), 'utf8')
      return html
        .replace('<!--CLASSIC-->', `<style>\n${css}\n</style>`)
        .replace('<body>\n</body>', `<body>${renderClassic(content)}</body>`)
    }
  }
}

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [classicBake()],
  build: {
    rollupOptions: {
      output: {
        // distinct names per world — the default 'index' collided across
        // src/desk/index.js and src/galaxy/index.js (wrong CSS got loaded)
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('/src/desk/')) return 'desk'
          if (id.includes('/src/galaxy/')) return 'galaxy'
          if (id.includes('/src/village/')) return 'village'
        }
      }
    }
  }
})
