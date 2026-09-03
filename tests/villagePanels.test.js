import { describe, it, expect } from 'vitest'
import { arcadeWin, docsPanel } from '../src/village/panels.js'
import { readFileSync } from 'node:fs'

const real = JSON.parse(readFileSync(new URL('../content/village.json', import.meta.url), 'utf8'))

describe('village panels', () => {
  it('a record-breaker reads the whole letter, signed D, and can send the screenshot', () => {
    const html = arcadeWin({ timeMs: 21340, moves: 88, code: 'ABCD', beat: true, email: 'x@y.z', letter: real.arcade.letter })
    expect(html).toContain('Dear person reading this,')
    expect(html).toContain('middle school')
    expect(html).toContain('<br>D</p>')
    expect(html).toContain('send David the screenshot')
    expect(html).toContain('mailto:x@y.z')
    expect(html).toContain('My%20address')
  })
  it('a non-record solve gets no letter', () => {
    const html = arcadeWin({ timeMs: 31000, moves: 90, code: 'ABCD', beat: false, email: 'x@y.z', letter: real.arcade.letter })
    expect(html).not.toContain('Dear person')
    expect(html).toContain('26.00 still stands')
  })
  it('the shelves show three documents in order, Hello-world readable, the rest still being written, then To be continued', () => {
    const html = docsPanel(real.library.documents, real.library.toBeContinued)
    const i1 = html.indexOf('Hello-world'), i2 = html.indexOf('Life Experience'), i3 = html.indexOf('anxious &amp; depression')
    expect(i1).toBeGreaterThan(-1); expect(i1).toBeLessThan(i2); expect(i2).toBeLessThan(i3)
    expect(html).toContain('I am David, 张晓航')
    expect(html).toContain('Still being written.')
    expect(html.trim().endsWith('</div>')).toBe(true)
    expect(html).toContain('....To be continued.')
    expect(html).not.toContain("David's life")
  })
})
