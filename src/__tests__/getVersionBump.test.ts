import { describe, expect, it, vi } from 'vitest'
import { getVersionBump } from '../getVersionBump.js'

vi.mock('conventional-recommended-bump', () => ({
  Bumper: class {
    constructor(public buildPath: string) {}
    loadPreset() { return this }
    bump() { return Promise.resolve({ releaseType: 'minor', reason: 'Feature added' }) }
  },
}))

describe('getVersionBump', () => {
  it('should return correct version bump recommendation', async () => {
    const rec = await getVersionBump('.')
    expect(rec).toEqual({ releaseType: 'minor', reason: 'Feature added' })
  })
})
