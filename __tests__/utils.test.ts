import * as utils from '../src/utils'
import { Minimatch, IMinimatch } from 'minimatch';

describe('#isMatch', () => {
  test('完全一致', async () => {
    const targets = [new Minimatch('src/hoge.rb')]
    expect(utils.isMatch('src/hoge.rb', targets)).toBe(true)
  })

  test('部分一致', async () => {
    const targets = [new Minimatch('src/ho*.rb')]
    expect(utils.isMatch('src/hoge.rb', targets)).toBe(true)
  })

  test('特定のディレクトリ配下', async () => {
    const targets = [new Minimatch('src/**/*')]
    expect(utils.isMatch('src/app/hoge.rb', targets)).toBe(true)
  })

  test('特定の拡張子', async () => {
    const targets = [new Minimatch('**/*.rb')]
    expect(utils.isMatch('src/app/models/hoge.rb', targets)).toBe(true)
  })
})