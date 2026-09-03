import { describe, it, expect } from 'vitest'
import { arcadeWin, docsPanel, worldmapView, boardGate, boardPanel, boardView, prizePanel } from '../src/village/panels.js'
import { readFileSync } from 'node:fs'

const real = JSON.parse(readFileSync(new URL('../content/village.json', import.meta.url), 'utf8'))

describe('world map + picture board', () => {
  const wm = real.home.worldmap
  it('root shows countries as groups and single stops; Next stop... is not clickable', () => {
    const html = worldmapView(wm)
    expect(html).toContain('data-wm-group="0"')
    expect(html).toContain('China')
    expect(html).toContain('data-wm-stop="2"')
    expect(html).toMatch(/v-place later"[^>]*disabled>Next stop\.\.\./)
    expect(html).not.toContain('北京')
  })
  it('opening China lists the cities; opening 北京 shows its photos (or that they are coming)', () => {
    const cities = worldmapView(wm, { group: 0 })
    expect(cities).toContain('北京')
    expect(cities).toContain('香港')
    expect(cities).toContain('data-wm-back="root"')
    const bj = worldmapView(wm, { group: 0, place: 0 })
    expect(bj).toContain('growing up')
    expect(bj).toContain('Photos coming.')
    const withPhotos = worldmapView({ stops: [{ place: 'Paris', photos: ['a.jpg', 'b.jpg'] }] }, { stop: 0 })
    expect(withPhotos.match(/<img /g)).toHaveLength(2)
  })
  it('the picture board gate never prints the code, only the hint', () => {
    const gate = boardGate(real.home.board.hint)
    expect(gate).toContain('birthday-month-day')
    expect(gate).not.toContain('0716')
    expect(gate.match(/<input /g)).toHaveLength(4)
    const root = boardPanel(real.home.board)
    expect(root).toContain('Middle School')
    expect(root).toMatch(/later"[^>]*disabled>Future\.\.\.\./)
    expect(root).not.toContain('<img')
    const mid = boardView(real.home.board, { section: 0 })
    expect(mid.match(/<img /g)).toHaveLength(12)
    expect(boardView(real.home.board, { section: 1 })).toContain('Photos coming.')
  })
})

describe('the quiz prize flip-book', () => {
  it('shows 我就sb! first, 我是花花我怕谁啊 second, one page at a time', () => {
    const html = prizePanel(real.library.prize)
    expect(real.library.prize.photos).toEqual(['prize/prize-01.jpg', 'prize/prize-02.jpg'])
    expect(html).toContain('data-pages="2"')
    expect(html).toContain('class="v-page on" data-i="0"')
    expect(html).toContain('class="v-page" data-i="1"')
    expect(html).toContain('data-page-next')
    expect(html).toContain('1 / 2')
    expect(prizePanel({})).toContain('claim ticket')
  })
})

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
